import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { 
          error: 'User ID is required',
          code: 'MISSING_USER_ID'
        },
        { status: 400 }
      );
    }

    const userIdInt = parseInt(userId);
    if (isNaN(userIdInt)) {
      return NextResponse.json(
        { 
          error: 'Valid User ID is required',
          code: 'INVALID_USER_ID'
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthStartStr = monthStart.toISOString().split('T')[0];
    const monthEndStr = monthEnd.toISOString().split('T')[0];

    const userTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userIdInt),
          gte(transactions.date, monthStartStr),
          lte(transactions.date, monthEndStr)
        )
      );

    let totalSpent = 0;
    let totalIncome = 0;
    const categorySpending: { [key: string]: number } = {};

    for (const transaction of userTransactions) {
      if (transaction.type === 'debit') {
        totalSpent += transaction.amount;
        
        // Exclude 'Income' category from spending categories
        if (transaction.category !== 'Income') {
          if (categorySpending[transaction.category]) {
            categorySpending[transaction.category] += transaction.amount;
          } else {
            categorySpending[transaction.category] = transaction.amount;
          }
        }
      } else if (transaction.type === 'credit') {
        totalIncome += transaction.amount;
      }
    }

    // Find top spending category with proper structure
    let topCategory: { category: string; amount: number } | null = null;
    let maxSpending = 0;

    for (const [category, amount] of Object.entries(categorySpending)) {
      if (amount > maxSpending) {
        maxSpending = amount;
        topCategory = { category, amount };
      }
    }

    return NextResponse.json({
      totalSpent,
      totalIncome,
      topCategory,
      categorySpending,
      transactionCount: userTransactions.length
    });

  } catch (error) {
    console.error('GET analytics error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}