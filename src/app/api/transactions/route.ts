import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions, users, budgets } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    // Single transaction by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const transaction = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, parseInt(id)))
        .limit(1);

      if (transaction.length === 0) {
        return NextResponse.json(
          { error: 'Transaction not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(transaction[0], { status: 200 });
    }

    // List transactions - userId required
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required for listing transactions', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const results = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, parseInt(userId)))
      .orderBy(desc(transactions.date), desc(transactions.id))
      .limit(limit)
      .offset(offset);

    // Return in expected format with transactions wrapper
    return NextResponse.json({ transactions: results }, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// Helper function to recalculate budget spent amounts
async function recalculateBudgetSpent(userId: number) {
  try {
    // Get current month start and end
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    // Get all budgets for user
    const userBudgets = await db
      .select()
      .from(budgets)
      .where(eq(budgets.userId, userId));

    // Get all debit transactions for current month
    const monthTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'debit'),
          sql`${transactions.date} >= ${monthStart}`,
          sql`${transactions.date} <= ${monthEnd}`
        )
      );

    // Calculate spending per category
    const categorySpending: Record<string, number> = {};
    for (const transaction of monthTransactions) {
      if (!categorySpending[transaction.category]) {
        categorySpending[transaction.category] = 0;
      }
      categorySpending[transaction.category] += transaction.amount;
    }

    // Update each budget with calculated spent amount
    for (const budget of userBudgets) {
      const spent = categorySpending[budget.category] || 0;
      await db
        .update(budgets)
        .set({ spent, updatedAt: new Date().toISOString() })
        .where(eq(budgets.id, budget.id));
    }
  } catch (error) {
    console.error('Error recalculating budget spent:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, category, merchant, date, type, description } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (!amount) {
      return NextResponse.json(
        { error: 'amount is required', code: 'MISSING_AMOUNT' },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: 'category is required', code: 'MISSING_CATEGORY' },
        { status: 400 }
      );
    }

    if (!merchant) {
      return NextResponse.json(
        { error: 'merchant is required', code: 'MISSING_MERCHANT' },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: 'date is required', code: 'MISSING_DATE' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: 'type is required', code: 'MISSING_TYPE' },
        { status: 400 }
      );
    }

    // Validate amount is positive
    if (parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'amount must be greater than 0', code: 'INVALID_AMOUNT' },
        { status: 400 }
      );
    }

    // Validate type
    if (type !== 'debit' && type !== 'credit') {
      return NextResponse.json(
        { error: 'type must be either "debit" or "credit"', code: 'INVALID_TYPE' },
        { status: 400 }
      );
    }

    // Validate userId exists
    const userExists = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(userId)))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Insert transaction
    const newTransaction = await db
      .insert(transactions)
      .values({
        userId: parseInt(userId),
        amount: parseFloat(amount),
        category: category.trim(),
        merchant: merchant.trim(),
        date: date.trim(),
        type: type.trim(),
        description: description ? description.trim() : null,
        createdAt: new Date().toISOString(),
      })
      .returning();

    // Update user balance
    const currentUser = userExists[0];
    const currentBalance = currentUser.balance;
    let newBalance: number;

    if (type === 'credit') {
      newBalance = currentBalance + parseFloat(amount);
    } else {
      newBalance = currentBalance - parseFloat(amount);
    }

    await db
      .update(users)
      .set({ balance: newBalance })
      .where(eq(users.id, parseInt(userId)));

    // Recalculate budget spent amounts after transaction
    await recalculateBudgetSpent(parseInt(userId));

    return NextResponse.json(newTransaction[0], { status: 201 });
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

    const body = await request.json();
    const { amount, category, merchant, date, type, description } = body;

    // Check if transaction exists
    const existingTransaction = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, parseInt(id)))
      .limit(1);

    if (existingTransaction.length === 0) {
      return NextResponse.json(
        { error: 'Transaction not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Validate amount if provided
    if (amount !== undefined && parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'amount must be greater than 0', code: 'INVALID_AMOUNT' },
        { status: 400 }
      );
    }

    // Validate type if provided
    if (type !== undefined && type !== 'debit' && type !== 'credit') {
      return NextResponse.json(
        { error: 'type must be either "debit" or "credit"', code: 'INVALID_TYPE' },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updates: any = {};

    if (amount !== undefined) updates.amount = parseFloat(amount);
    if (category !== undefined) updates.category = category.trim();
    if (merchant !== undefined) updates.merchant = merchant.trim();
    if (date !== undefined) updates.date = date.trim();
    if (type !== undefined) updates.type = type.trim();
    if (description !== undefined) updates.description = description ? description.trim() : null;

    // Only update if there are changes
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(existingTransaction[0], { status: 200 });
    }

    const updatedTransaction = await db
      .update(transactions)
      .set(updates)
      .where(eq(transactions.id, parseInt(id)))
      .returning();

    // Recalculate budget spent amounts after update
    await recalculateBudgetSpent(existingTransaction[0].userId);

    return NextResponse.json(updatedTransaction[0], { status: 200 });
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

    // Check if transaction exists
    const existingTransaction = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, parseInt(id)))
      .limit(1);

    if (existingTransaction.length === 0) {
      return NextResponse.json(
        { error: 'Transaction not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deletedTransaction = await db
      .delete(transactions)
      .where(eq(transactions.id, parseInt(id)))
      .returning();

    // Recalculate budget spent amounts after deletion
    await recalculateBudgetSpent(existingTransaction[0].userId);

    return NextResponse.json(
      {
        message: 'Transaction deleted successfully',
        transaction: deletedTransaction[0],
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