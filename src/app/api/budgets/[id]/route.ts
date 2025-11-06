import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { budgets } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

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

    return NextResponse.json(budget[0], { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

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

    const requestBody = await request.json();
    const { category, limitAmount, spent } = requestBody;

    const updates: {
      category?: string;
      limitAmount?: number;
      spent?: number;
      updatedAt: string;
    } = {
      updatedAt: new Date().toISOString(),
    };

    if (category !== undefined) {
      if (typeof category !== 'string' || category.trim() === '') {
        return NextResponse.json(
          { error: 'Category must be a non-empty string', code: 'INVALID_CATEGORY' },
          { status: 400 }
        );
      }
      updates.category = category.trim();
    }

    if (limitAmount !== undefined) {
      if (typeof limitAmount !== 'number' || limitAmount < 0) {
        return NextResponse.json(
          { error: 'Limit amount must be a non-negative number', code: 'INVALID_LIMIT_AMOUNT' },
          { status: 400 }
        );
      }
      updates.limitAmount = limitAmount;
    }

    if (spent !== undefined) {
      if (typeof spent !== 'number' || spent < 0) {
        return NextResponse.json(
          { error: 'Spent amount must be a non-negative number', code: 'INVALID_SPENT' },
          { status: 400 }
        );
      }
      updates.spent = spent;
    }

    const updated = await db
      .update(budgets)
      .set(updates)
      .where(eq(budgets.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Budget not found', code: 'BUDGET_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

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

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Budget not found', code: 'BUDGET_NOT_FOUND' },
        { status: 404 }
      );
    }

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