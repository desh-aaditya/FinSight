import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, question } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    // Validate GEMINI_API_KEY
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { 
          error: 'Gemini API key not configured', 
          code: 'MISSING_API_KEY',
          message: 'Please set GEMINI_API_KEY environment variable'
        },
        { status: 500 }
      );
    }

    // Fetch user's recent transactions for context
    const userTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, parseInt(userId)))
      .orderBy(desc(transactions.date))
      .limit(20);

    // Calculate spending patterns
    const now = new Date();
    const thisMonthTransactions = userTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === now.getMonth() && 
             transactionDate.getFullYear() === now.getFullYear();
    });

    const totalSpent = thisMonthTransactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = thisMonthTransactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);

    const categorySpending = thisMonthTransactions
      .filter(t => t.type === 'debit')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    // Build context for AI
    const financialContext = `
User Financial Summary:
- Total spent this month: ₹${totalSpent.toFixed(2)}
- Total income this month: ₹${totalIncome.toFixed(2)}
- Net balance: ₹${(totalIncome - totalSpent).toFixed(2)}
- Top spending categories: ${Object.entries(categorySpending)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cat, amt]) => `${cat} (₹${amt.toFixed(2)})`)
      .join(', ')}

Recent transactions:
${userTransactions.slice(0, 5).map(t => 
  `- ${t.date}: ${t.type === 'debit' ? '-' : '+'}₹${t.amount} on ${t.category} (${t.merchant})`
).join('\n')}
    `;

    const prompt = question 
      ? `${financialContext}\n\nUser question: ${question}\n\nProvide helpful, personalized financial advice based on the user's spending patterns and question. Keep the response conversational, practical, and actionable.`
      : `${financialContext}\n\nProvide personalized financial advice and recommendations to help the user improve their financial health. Focus on spending reduction, savings opportunities, and budget optimization. Keep the advice conversational and actionable.`;

    // Call Gemini API with correct model name (gemini-2.5-flash)
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return NextResponse.json(
        { 
          error: 'Failed to get AI advice', 
          code: 'GEMINI_API_ERROR',
          details: errorText
        },
        { status: 500 }
      );
    }

    const geminiData = await geminiResponse.json();

    // Extract advice from response
    const advice = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate advice at this time.';

    return NextResponse.json({
      advice,
      context: {
        totalSpent,
        totalIncome,
        netBalance: totalIncome - totalSpent,
        topCategories: Object.entries(categorySpending)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([category, amount]) => ({ category, amount }))
      }
    }, { status: 200 });

  } catch (error) {
    console.error('AI advice endpoint error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error as Error).message,
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}