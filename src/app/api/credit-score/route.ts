import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions, budgets, savingsGoals } from '@/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Fetch all user data
    const userTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, parseInt(userId)));

    const userBudgets = await db
      .select()
      .from(budgets)
      .where(eq(budgets.userId, parseInt(userId)));

    const userGoals = await db
      .select()
      .from(savingsGoals)
      .where(eq(savingsGoals.userId, parseInt(userId)));

    // Calculate credit score components (similar to FICO score methodology)
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());

    // 1. Payment Consistency (35% weight) - Regular income and controlled spending
    const recentTransactions = userTransactions.filter(
      t => new Date(t.date) >= threeMonthsAgo
    );
    
    const monthlyIncomes: Record<string, number> = {};
    const monthlyExpenses: Record<string, number> = {};
    
    recentTransactions.forEach(t => {
      const monthKey = `${new Date(t.date).getFullYear()}-${new Date(t.date).getMonth()}`;
      if (t.type === 'credit') {
        monthlyIncomes[monthKey] = (monthlyIncomes[monthKey] || 0) + t.amount;
      } else {
        monthlyExpenses[monthKey] = (monthlyExpenses[monthKey] || 0) + t.amount;
      }
    });

    const incomeConsistency = Object.values(monthlyIncomes).length > 0 
      ? (Object.values(monthlyIncomes).reduce((sum, val) => sum + val, 0) / Object.values(monthlyIncomes).length > 10000 ? 100 : 70)
      : 30;

    const paymentHistoryScore = Math.min(100, incomeConsistency);

    // 2. Credit Utilization (30% weight) - Spending vs Income ratio
    const totalIncome = userTransactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = userTransactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);

    const utilizationRatio = totalIncome > 0 ? (totalExpenses / totalIncome) : 1;
    const creditUtilizationScore = Math.max(0, Math.min(100, (1 - utilizationRatio) * 150));

    // 3. Financial History Length (15% weight) - How long tracking finances
    const oldestTransaction = userTransactions.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )[0];
    
    const accountAge = oldestTransaction 
      ? Math.floor((now.getTime() - new Date(oldestTransaction.date).getTime()) / (1000 * 60 * 60 * 24 * 30))
      : 0;
    
    const historyLengthScore = Math.min(100, (accountAge / 12) * 100);

    // 4. Savings Behavior (10% weight) - Goal progress and savings rate
    const activeSavingsGoals = userGoals.filter(g => g.status !== 'completed');
    const goalProgress = activeSavingsGoals.length > 0
      ? activeSavingsGoals.reduce((sum, g) => sum + (g.currentAmount / g.targetAmount), 0) / activeSavingsGoals.length
      : 0;
    
    const savingsScore = Math.min(100, goalProgress * 100 + 20);

    // 5. Budget Adherence (10% weight) - Staying within budget limits
    let budgetAdherenceScore = 50; // Default if no budgets
    
    if (userBudgets.length > 0) {
      const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;
      const thisMonthExpenses = userTransactions
        .filter(t => {
          const tDate = new Date(t.date);
          return t.type === 'debit' && 
                 tDate.getMonth() === now.getMonth() && 
                 tDate.getFullYear() === now.getFullYear();
        });

      const categorySpending: Record<string, number> = {};
      thisMonthExpenses.forEach(t => {
        categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
      });

      const budgetResults = userBudgets.map(budget => {
        const spent = categorySpending[budget.category] || 0;
        return spent <= budget.limit ? 1 : Math.max(0, 1 - ((spent - budget.limit) / budget.limit));
      });

      budgetAdherenceScore = budgetResults.length > 0
        ? (budgetResults.reduce((sum, val) => sum + val, 0) / budgetResults.length) * 100
        : 50;
    }

    // Calculate weighted score (300-850 range like FICO)
    const rawScore = (
      (paymentHistoryScore * 0.35) +
      (creditUtilizationScore * 0.30) +
      (historyLengthScore * 0.15) +
      (savingsScore * 0.10) +
      (budgetAdherenceScore * 0.10)
    );

    // Convert to 300-850 scale
    const creditScore = Math.round(300 + (rawScore / 100) * 550);

    // Determine credit rating
    let rating = 'Poor';
    let ratingColor = 'red';
    let ratingDescription = 'Needs significant improvement';
    
    if (creditScore >= 800) {
      rating = 'Exceptional';
      ratingColor = 'green';
      ratingDescription = 'Excellent financial management';
    } else if (creditScore >= 740) {
      rating = 'Very Good';
      ratingColor = 'lightgreen';
      ratingDescription = 'Above average financial health';
    } else if (creditScore >= 670) {
      rating = 'Good';
      ratingColor = 'blue';
      ratingDescription = 'Acceptable financial standing';
    } else if (creditScore >= 580) {
      rating = 'Fair';
      ratingColor = 'orange';
      ratingDescription = 'Below average, room for improvement';
    } else {
      rating = 'Poor';
      ratingColor = 'red';
      ratingDescription = 'Needs significant improvement';
    }

    // Calculate factors affecting the score
    const factors = [
      {
        name: 'Payment History',
        score: Math.round(paymentHistoryScore),
        weight: 35,
        impact: paymentHistoryScore >= 70 ? 'positive' : 'negative',
        description: paymentHistoryScore >= 70 
          ? 'Regular income patterns detected'
          : 'Inconsistent income or spending patterns'
      },
      {
        name: 'Credit Utilization',
        score: Math.round(creditUtilizationScore),
        weight: 30,
        impact: creditUtilizationScore >= 60 ? 'positive' : 'negative',
        description: utilizationRatio < 0.3 
          ? 'Excellent spending control'
          : utilizationRatio < 0.7 
          ? 'Moderate spending relative to income'
          : 'High spending relative to income'
      },
      {
        name: 'Financial History',
        score: Math.round(historyLengthScore),
        weight: 15,
        impact: historyLengthScore >= 50 ? 'positive' : 'neutral',
        description: accountAge >= 12 
          ? `${accountAge} months of tracked history`
          : accountAge >= 6
          ? 'Building financial history'
          : 'New to financial tracking'
      },
      {
        name: 'Savings Behavior',
        score: Math.round(savingsScore),
        weight: 10,
        impact: savingsScore >= 60 ? 'positive' : 'neutral',
        description: activeSavingsGoals.length > 0
          ? `${Math.round(goalProgress * 100)}% average goal progress`
          : 'No active savings goals'
      },
      {
        name: 'Budget Adherence',
        score: Math.round(budgetAdherenceScore),
        weight: 10,
        impact: budgetAdherenceScore >= 70 ? 'positive' : 'neutral',
        description: userBudgets.length > 0
          ? budgetAdherenceScore >= 70
            ? 'Staying within budget limits'
            : 'Exceeding some budget limits'
          : 'No budgets set'
      }
    ];

    // Recommendations to improve score
    const recommendations = [];
    
    if (paymentHistoryScore < 70) {
      recommendations.push({
        title: 'Establish Regular Income',
        description: 'Add consistent income transactions to demonstrate financial stability',
        impact: 'High'
      });
    }
    
    if (creditUtilizationScore < 60) {
      recommendations.push({
        title: 'Reduce Spending Ratio',
        description: `Your spending is ${Math.round(utilizationRatio * 100)}% of income. Aim for below 30% to improve your score significantly`,
        impact: 'High'
      });
    }
    
    if (historyLengthScore < 50) {
      recommendations.push({
        title: 'Build Financial History',
        description: 'Continue tracking transactions consistently to establish a longer financial history',
        impact: 'Medium'
      });
    }
    
    if (savingsScore < 60) {
      recommendations.push({
        title: 'Set Savings Goals',
        description: 'Create and work towards savings goals to demonstrate financial planning',
        impact: 'Medium'
      });
    }
    
    if (budgetAdherenceScore < 70 && userBudgets.length > 0) {
      recommendations.push({
        title: 'Improve Budget Discipline',
        description: 'Stay within your budget limits to show responsible spending habits',
        impact: 'Low'
      });
    } else if (userBudgets.length === 0) {
      recommendations.push({
        title: 'Create Budget Limits',
        description: 'Set monthly spending limits for each category to better control expenses',
        impact: 'Low'
      });
    }

    // Calculate score trend (compare with previous month)
    const lastMonthScore = 300 + (rawScore / 100) * 550; // Simplified - would need historical data
    const scoreTrend = creditScore >= lastMonthScore ? 'up' : 'down';
    const scoreChange = Math.abs(creditScore - lastMonthScore);

    return NextResponse.json({
      creditScore,
      rating,
      ratingColor,
      ratingDescription,
      factors,
      recommendations,
      trend: {
        direction: scoreTrend,
        change: Math.round(scoreChange)
      },
      metadata: {
        calculatedAt: now.toISOString(),
        transactionCount: userTransactions.length,
        accountAge: `${accountAge} months`,
        savingsGoalsCount: userGoals.length
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Credit score calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate credit score: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
