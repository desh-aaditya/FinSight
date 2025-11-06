import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { budgets, transactions } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

// Helper function to recalculate spent for a single budget
async function calculateBudgetSpent(userId: number, category: string): Promise<number> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const result = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'debit'),
        eq(transactions.category, category),
        sql`${transactions.date} >= ${monthStart}`,
        sql`${transactions.date} <= ${monthEnd}`
      )
    );

  return result.reduce((sum, t) => sum + t.amount, 0);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    // Get single budget by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const budget = await db
        .select()
        .from(budgets)
        .where(eq(budgets.id, parseInt(id)))
        .limit(1);

      if (budget.length === 0) {
        return NextResponse.json(
          { error: 'Budget not found', code: 'BUDGET_NOT_FOUND' },
          { status: 404 }
        );
      }

      // Recalculate spent amount
      const spent = await calculateBudgetSpent(budget[0].userId, budget[0].category);
      const updatedBudget = { ...budget[0], spent };

      return NextResponse.json(updatedBudget, { status: 200 });
    }

    // List budgets for user
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required for listing budgets', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    const userBudgets = await db
      .select()
      .from(budgets)
      .where(eq(budgets.userId, parseInt(userId)));

    // Recalculate spent amounts for all budgets
    const budgetsWithSpent = await Promise.all(
      userBudgets.map(async (budget) => {
        const spent = await calculateBudgetSpent(parseInt(userId), budget.category);
        return { ...budget, spent };
      })
    );

    return NextResponse.json({ budgets: budgetsWithSpent }, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, category, limitAmount, spent } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (!category || category.trim() === '') {
      return NextResponse.json(
        { error: 'category is required', code: 'MISSING_CATEGORY' },
        { status: 400 }
      );
    }

    if (limitAmount === undefined || limitAmount === null) {
      return NextResponse.json(
        { error: 'limitAmount is required', code: 'MISSING_LIMIT_AMOUNT' },
        { status: 400 }
      );
    }

    // Validate limitAmount is positive
    if (typeof limitAmount !== 'number' || limitAmount <= 0) {
      return NextResponse.json(
        { error: 'limitAmount must be a positive number', code: 'INVALID_LIMIT_AMOUNT' },
        { status: 400 }
      );
    }

    // Validate userId is valid integer
    if (isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: 'userId must be a valid integer', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Calculate actual spent amount from transactions
    const actualSpent = await calculateBudgetSpent(parseInt(userId), category.trim());

    const newBudget = await db
      .insert(budgets)
      .values({
        userId: parseInt(userId),
        category: category.trim(),
        limitAmount,
        spent: actualSpent, // Use calculated spent instead of provided value
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newBudget[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if budget exists
    const existingBudget = await db
      .select()
      .from(budgets)
      .where(eq(budgets.id, parseInt(id)))
      .limit(1);

    if (existingBudget.length === 0) {
      return NextResponse.json(
        { error: 'Budget not found', code: 'BUDGET_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { category, limitAmount, spent } = body;

    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    // Only update provided fields
    if (category !== undefined) {
      if (category.trim() === '') {
        return NextResponse.json(
          { error: 'category cannot be empty', code: 'INVALID_CATEGORY' },
          { status: 400 }
        );
      }
      updates.category = category.trim();
    }

    if (limitAmount !== undefined) {
      if (typeof limitAmount !== 'number' || limitAmount <= 0) {
        return NextResponse.json(
          { error: 'limitAmount must be a positive number', code: 'INVALID_LIMIT_AMOUNT' },
          { status: 400 }
        );
      }
      updates.limitAmount = limitAmount;
    }

    if (spent !== undefined) {
      if (typeof spent !== 'number' || spent < 0) {
        return NextResponse.json(
          { error: 'spent must be a non-negative number', code: 'INVALID_SPENT' },
          { status: 400 }
        );
      }
      updates.spent = spent;
    }

    const updatedBudget = await db
      .update(budgets)
      .set(updates)
      .where(eq(budgets.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedBudget[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if budget exists before deleting
    const existingBudget = await db
      .select()
      .from(budgets)
      .where(eq(budgets.id, parseInt(id)))
      .limit(1);

    if (existingBudget.length === 0) {
      return NextResponse.json(
        { error: 'Budget not found', code: 'BUDGET_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(budgets)
      .where(eq(budgets.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Budget deleted successfully',
        budget: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}