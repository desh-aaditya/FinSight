import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions, users, budgets } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

interface CSVRow {
  date: string;
  category: string;
  amount: string;
  merchant: string;
  type?: string;
  description?: string;
}

// Helper function to recalculate budget spent amounts
async function recalculateBudgetSpent(userId: number) {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const userBudgets = await db
      .select()
      .from(budgets)
      .where(eq(budgets.userId, userId));

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

    const categorySpending: Record<string, number> = {};
    for (const transaction of monthTransactions) {
      if (!categorySpending[transaction.category]) {
        categorySpending[transaction.category] = 0;
      }
      categorySpending[transaction.category] += transaction.amount;
    }

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
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    // Validate inputs
    if (!file) {
      return NextResponse.json(
        { error: 'File is required', code: 'MISSING_FILE' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Only CSV files are allowed', code: 'INVALID_FILE_TYPE' },
        { status: 400 }
      );
    }

    // Validate user exists
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

    // Read and parse CSV
    const csvText = await file.text();
    const lines = csvText.split('\n').filter(line => line.trim() !== '');

    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV file must contain headers and at least one data row', code: 'EMPTY_CSV' },
        { status: 400 }
      );
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Validate required columns
    const requiredColumns = ['date', 'category', 'amount', 'merchant'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      return NextResponse.json(
        { 
          error: `Missing required columns: ${missingColumns.join(', ')}`, 
          code: 'INVALID_CSV_FORMAT',
          requiredColumns: ['date', 'category', 'amount', 'merchant', 'type (optional)', 'description (optional)']
        },
        { status: 400 }
      );
    }

    // Parse data rows
    const validTransactions: any[] = [];
    const errors: Array<{ row: number; error: string }> = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      if (values.length < headers.length) {
        errors.push({ row: i + 1, error: 'Incomplete row data' });
        continue;
      }

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });

      // Validate required fields
      if (!row.date || !row.category || !row.amount || !row.merchant) {
        errors.push({ row: i + 1, error: 'Missing required field' });
        continue;
      }

      // Validate amount
      const amount = parseFloat(row.amount);
      if (isNaN(amount) || amount <= 0) {
        errors.push({ row: i + 1, error: 'Invalid amount (must be positive number)' });
        continue;
      }

      // Validate date format (accepts YYYY-MM-DD, MM/DD/YYYY, or other ISO formats)
      const dateStr = row.date;
      let parsedDate: Date;
      
      if (dateStr.includes('/')) {
        // Handle MM/DD/YYYY format
        const [month, day, year] = dateStr.split('/');
        parsedDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      } else {
        parsedDate = new Date(dateStr);
      }

      if (isNaN(parsedDate.getTime())) {
        errors.push({ row: i + 1, error: 'Invalid date format (use YYYY-MM-DD or MM/DD/YYYY)' });
        continue;
      }

      // Validate type if provided
      const type = row.type?.toLowerCase() || 'debit';
      if (type !== 'debit' && type !== 'credit') {
        errors.push({ row: i + 1, error: 'Type must be either "debit" or "credit"' });
        continue;
      }

      // Build transaction object
      validTransactions.push({
        userId: parseInt(userId),
        amount,
        category: row.category.trim(),
        merchant: row.merchant.trim(),
        date: parsedDate.toISOString().split('T')[0],
        type,
        description: row.description?.trim() || `Imported: ${row.merchant}`,
        createdAt: new Date().toISOString(),
      });
    }

    // Return validation errors if no valid transactions
    if (validTransactions.length === 0) {
      return NextResponse.json(
        { 
          error: 'No valid transactions found in CSV', 
          code: 'NO_VALID_TRANSACTIONS',
          errors 
        },
        { status: 400 }
      );
    }

    // Insert transactions in batch
    const insertedTransactions = await db
      .insert(transactions)
      .values(validTransactions)
      .returning();

    // Update user balance based on inserted transactions
    const currentUser = userExists[0];
    let balanceChange = 0;

    for (const txn of validTransactions) {
      if (txn.type === 'credit') {
        balanceChange += txn.amount;
      } else {
        balanceChange -= txn.amount;
      }
    }

    const newBalance = currentUser.balance + balanceChange;
    await db
      .update(users)
      .set({ balance: newBalance })
      .where(eq(users.id, parseInt(userId)));

    // Recalculate budget spent amounts after CSV import
    await recalculateBudgetSpent(parseInt(userId));

    return NextResponse.json({
      message: 'CSV uploaded successfully',
      imported: insertedTransactions.length,
      errors: errors.length > 0 ? errors : undefined,
      balanceChange,
      newBalance,
      transactions: insertedTransactions
    }, { status: 201 });

  } catch (error) {
    console.error('CSV upload error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error as Error).message,
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}