import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions } from '@/db/schema';
import { eq, and, gte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Validate userId
    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json(
        { 
          error: 'Valid userId is required',
          code: 'MISSING_USER_ID'
        },
        { status: 400 }
      );
    }

    const userIdInt = parseInt(userId);

    // Calculate date range for last 6 months including current month
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const startDate = sixMonthsAgo.toISOString().substring(0, 10);

    // Query all transactions for user in date range
    const userTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userIdInt),
          gte(transactions.date, startDate)
        )
      );

    // Generate array of last 6 months
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const last6Months: Array<{
      month: string;
      amount: number;
      expenditure: number;
      income: number;
      categories: Record<string, number>;
    }> = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

      last6Months.push({
        month: monthKey,
        amount: 0,
        expenditure: 0,
        income: 0,
        categories: {}
      });
    }

    // Group transactions by month and calculate totals
    userTransactions.forEach((transaction) => {
      const transactionDate = new Date(transaction.date);
      const monthKey = `${monthNames[transactionDate.getMonth()]} ${transactionDate.getFullYear()}`;
      const monthIndex = last6Months.findIndex(m => m.month === monthKey);

      if (monthIndex !== -1) {
        if (transaction.type === 'debit') {
          last6Months[monthIndex].expenditure += transaction.amount;
          last6Months[monthIndex].amount += transaction.amount;
          
          // Track category spending (exclude Income category)
          if (transaction.category !== 'Income') {
            if (!last6Months[monthIndex].categories[transaction.category]) {
              last6Months[monthIndex].categories[transaction.category] = 0;
            }
            last6Months[monthIndex].categories[transaction.category] += transaction.amount;
          }
        } else if (transaction.type === 'credit') {
          last6Months[monthIndex].income += transaction.amount;
        }
      }
    });

    // Round totals to 2 decimal places
    last6Months.forEach(month => {
      month.amount = Math.round(month.amount * 100) / 100;
      month.expenditure = Math.round(month.expenditure * 100) / 100;
      month.income = Math.round(month.income * 100) / 100;
      
      // Round category amounts
      Object.keys(month.categories).forEach(category => {
        month.categories[category] = Math.round(month.categories[category] * 100) / 100;
      });
    });

    return NextResponse.json({ trend: last6Months }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}