import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions, budgets, savingsGoals } from '@/db/schema';
import { eq } from 'drizzle-orm';

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

    // CIBIL Score calculation (300-900 range - India specific)
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());

    // 1. Payment History & Regularity (30% weight)
    const recentTransactions = userTransactions.filter(
      t => new Date(t.date) >= threeMonthsAgo
    );
    
    const monthlyData: Record<string, { income: number; expense: number }> = {};
    
    recentTransactions.forEach(t => {
      const monthKey = `${new Date(t.date).getFullYear()}-${new Date(t.date).getMonth()}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0 };
      }
      if (t.type === 'credit') {
        monthlyData[monthKey].income += t.amount;
      } else {
        monthlyData[monthKey].expense += t.amount;
      }
    });

    const monthsWithActivity = Object.keys(monthlyData).length;
    const avgMonthlyIncome = monthsWithActivity > 0 
      ? Object.values(monthlyData).reduce((sum, m) => sum + m.income, 0) / monthsWithActivity
      : 0;

    const paymentRegularityScore = monthsWithActivity >= 3 && avgMonthlyIncome > 15000 ? 95 : 
                                   monthsWithActivity >= 2 && avgMonthlyIncome > 10000 ? 75 :
                                   monthsWithActivity >= 1 ? 50 : 25;

    // 2. Credit Mix & Utilization (25% weight)
    const totalIncome = userTransactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = userTransactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);

    const debtToIncomeRatio = totalIncome > 0 ? (totalExpenses / totalIncome) : 1;
    
    // CIBIL considers lower DTI ratio as better
    const creditMixScore = debtToIncomeRatio < 0.3 ? 100 :
                           debtToIncomeRatio < 0.5 ? 80 :
                           debtToIncomeRatio < 0.7 ? 60 :
                           debtToIncomeRatio < 0.9 ? 40 : 20;

    // 3. Credit Age & Length (25% weight)
    const sortedTransactions = userTransactions.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const oldestTransaction = sortedTransactions[0];
    const accountAgeMonths = oldestTransaction 
      ? Math.floor((now.getTime() - new Date(oldestTransaction.date).getTime()) / (1000 * 60 * 60 * 24 * 30))
      : 0;
    
    // CIBIL prefers longer credit history
    const creditAgeScore = accountAgeMonths >= 24 ? 100 :
                          accountAgeMonths >= 12 ? 80 :
                          accountAgeMonths >= 6 ? 60 :
                          accountAgeMonths >= 3 ? 40 : 20;

    // 4. Recent Credit Behavior (15% weight)
    const last30DaysTransactions = userTransactions.filter(
      t => new Date(t.date) >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    );
    
    const recentDebitCount = last30DaysTransactions.filter(t => t.type === 'debit').length;
    const recentCreditCount = last30DaysTransactions.filter(t => t.type === 'credit').length;
    
    // Multiple income sources and controlled expenses are positive
    const recentBehaviorScore = recentCreditCount >= 2 && recentDebitCount <= 10 ? 90 :
                               recentCreditCount >= 1 && recentDebitCount <= 15 ? 70 :
                               recentDebitCount <= 20 ? 50 : 30;

    // 5. Financial Discipline (5% weight) - Savings and budgets
    const activeSavingsGoals = userGoals.filter(g => g.status !== 'completed');
    const avgGoalProgress = activeSavingsGoals.length > 0
      ? activeSavingsGoals.reduce((sum, g) => sum + (g.currentAmount / g.targetAmount), 0) / activeSavingsGoals.length
      : 0;
    
    const hasBudgets = userBudgets.length > 0;
    const disciplineScore = (avgGoalProgress * 100 * 0.6) + (hasBudgets ? 40 : 0);

    // Calculate weighted CIBIL score (300-900 range)
    const rawScore = (
      (paymentRegularityScore * 0.30) +
      (creditMixScore * 0.25) +
      (creditAgeScore * 0.25) +
      (recentBehaviorScore * 0.15) +
      (disciplineScore * 0.05)
    );

    // Convert to 300-900 scale (CIBIL specific)
    const cibilScore = Math.round(300 + (rawScore / 100) * 600);

    // Determine CIBIL rating bands
    let rating = 'Poor';
    let ratingColor = 'red';
    let ratingDescription = 'High risk - Loan approval unlikely';
    
    if (cibilScore >= 750) {
      rating = 'Excellent';
      ratingColor = 'green';
      ratingDescription = 'Low risk - Best loan terms available';
    } else if (cibilScore >= 700) {
      rating = 'Good';
      ratingColor = 'lightgreen';
      ratingDescription = 'Medium risk - Good loan approval chances';
    } else if (cibilScore >= 650) {
      rating = 'Fair';
      ratingColor = 'orange';
      ratingDescription = 'Moderate risk - Limited loan options';
    } else if (cibilScore >= 550) {
      rating = 'Poor';
      ratingColor = 'darkorange';
      ratingDescription = 'High risk - Loan approval difficult';
    } else {
      rating = 'Very Poor';
      ratingColor = 'red';
      ratingDescription = 'Very high risk - Loan approval unlikely';
    }

    // Detailed factors
    const factors = [
      {
        name: 'Payment History',
        score: Math.round(paymentRegularityScore),
        weight: 30,
        impact: paymentRegularityScore >= 75 ? 'positive' : 'negative',
        description: monthsWithActivity >= 3 
          ? `${monthsWithActivity} months of consistent activity`
          : 'Limited payment history'
      },
      {
        name: 'Credit Mix',
        score: Math.round(creditMixScore),
        weight: 25,
        impact: creditMixScore >= 70 ? 'positive' : 'negative',
        description: debtToIncomeRatio < 0.3 
          ? 'Excellent debt management'
          : debtToIncomeRatio < 0.7 
          ? 'Moderate debt levels'
          : 'High debt burden'
      },
      {
        name: 'Credit Age',
        score: Math.round(creditAgeScore),
        weight: 25,
        impact: creditAgeScore >= 60 ? 'positive' : 'neutral',
        description: accountAgeMonths >= 12 
          ? `${accountAgeMonths} months credit history`
          : 'Building credit history'
      },
      {
        name: 'Recent Behavior',
        score: Math.round(recentBehaviorScore),
        weight: 15,
        impact: recentBehaviorScore >= 70 ? 'positive' : 'neutral',
        description: `${recentDebitCount} expenses, ${recentCreditCount} income sources in last 30 days`
      },
      {
        name: 'Financial Discipline',
        score: Math.round(disciplineScore),
        weight: 5,
        impact: disciplineScore >= 50 ? 'positive' : 'neutral',
        description: activeSavingsGoals.length > 0 || hasBudgets
          ? 'Active financial planning'
          : 'No active financial goals'
      }
    ];

    // CIBIL-specific recommendations
    const recommendations = [];
    
    if (paymentRegularityScore < 75) {
      recommendations.push({
        title: 'Maintain Regular Income',
        description: 'Show at least 3 months of consistent income to improve CIBIL score',
        impact: 'High',
        priority: 1
      });
    }
    
    if (creditMixScore < 70) {
      recommendations.push({
        title: 'Reduce Debt-to-Income Ratio',
        description: `Current DTI: ${Math.round(debtToIncomeRatio * 100)}%. Keep it below 30% for excellent score`,
        impact: 'High',
        priority: 2
      });
    }
    
    if (creditAgeScore < 60) {
      recommendations.push({
        title: 'Build Credit History',
        description: 'Maintain accounts for at least 12-24 months for better CIBIL score',
        impact: 'Medium',
        priority: 3
      });
    }
    
    if (recentBehaviorScore < 70) {
      recommendations.push({
        title: 'Control Recent Spending',
        description: 'Reduce number of expense transactions to show better financial control',
        impact: 'Medium',
        priority: 4
      });
    }
    
    if (disciplineScore < 50) {
      recommendations.push({
        title: 'Demonstrate Financial Planning',
        description: 'Set savings goals and budgets to show responsible financial behavior',
        impact: 'Low',
        priority: 5
      });
    }

    // Loan eligibility indicator
    let loanEligibility = {
      personalLoan: cibilScore >= 700,
      homeLoan: cibilScore >= 720,
      carLoan: cibilScore >= 680,
      creditCard: cibilScore >= 650,
      message: cibilScore >= 750 
        ? 'Eligible for all loan types with best interest rates'
        : cibilScore >= 700
        ? 'Eligible for most loans with competitive rates'
        : cibilScore >= 650
        ? 'Limited loan options with higher interest rates'
        : 'Improve score to access better loan products'
    };

    return NextResponse.json({
      cibilScore,
      rating,
      ratingColor,
      ratingDescription,
      factors,
      recommendations,
      loanEligibility,
      metadata: {
        calculatedAt: now.toISOString(),
        transactionCount: userTransactions.length,
        accountAge: `${accountAgeMonths} months`,
        avgMonthlyIncome: Math.round(avgMonthlyIncome),
        debtToIncomeRatio: `${Math.round(debtToIncomeRatio * 100)}%`
      }
    }, { status: 200 });

  } catch (error) {
    console.error('CIBIL score calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate CIBIL score: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
