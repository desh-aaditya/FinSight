import { Transaction } from '@/types';

// Simple Linear Regression for expense prediction
export function predictNextMonthExpenditure(transactions: Transaction[]): number {
  // Group transactions by month
  const monthlyExpenses: { [key: string]: number } = {};
  
  transactions
    .filter(t => t.type === 'debit')
    .forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      monthlyExpenses[monthKey] = (monthlyExpenses[monthKey] || 0) + t.amount;
    });

  const months = Object.keys(monthlyExpenses).sort();
  const expenses = months.map(m => monthlyExpenses[m]);

  if (expenses.length < 2) {
    return expenses[0] || 0;
  }

  // Simple linear regression
  const n = expenses.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = expenses;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Predict next month
  const prediction = slope * n + intercept;

  return Math.max(0, prediction);
}

export function calculateMonthlyTrend(transactions: Transaction[]): Array<{ month: string; amount: number }> {
  const monthlyData: { [key: string]: number } = {};
  
  transactions
    .filter(t => t.type === 'debit')
    .forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + t.amount;
    });

  return Object.entries(monthlyData)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .slice(-6)
    .map(([month, amount]) => ({ month, amount }));
}

export function calculateCategoryWiseSpending(transactions: Transaction[]): Array<{ category: string; amount: number; percentage: number }> {
  const categoryData: { [key: string]: number } = {};
  let total = 0;
  
  transactions
    .filter(t => t.type === 'debit' && t.category !== 'Income')
    .forEach(t => {
      categoryData[t.category] = (categoryData[t.category] || 0) + t.amount;
      total += t.amount;
    });

  return Object.entries(categoryData)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / total) * 100
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function calculateIncomeVsExpenditure(transactions: Transaction[]): Array<{ month: string; income: number; expenditure: number }> {
  const monthlyData: { [key: string]: { income: number; expenditure: number } } = {};
  
  transactions.forEach(t => {
    const date = new Date(t.date);
    const monthKey = `${date.toLocaleString('default', { month: 'short' })}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { income: 0, expenditure: 0 };
    }
    
    if (t.type === 'credit') {
      monthlyData[monthKey].income += t.amount;
    } else {
      monthlyData[monthKey].expenditure += t.amount;
    }
  });

  return Object.entries(monthlyData)
    .slice(-6)
    .map(([month, data]) => ({
      month,
      income: data.income,
      expenditure: data.expenditure
    }));
}

export function generateFinancialInsights(
  transactions: Transaction[],
  previousMonthTransactions: Transaction[]
): string[] {
  const insights: string[] = [];
  
  // Current month category spending
  const currentCategorySpending = calculateCategoryWiseSpending(transactions);
  const previousCategorySpending = calculateCategoryWiseSpending(previousMonthTransactions);
  
  // Compare with previous month
  currentCategorySpending.forEach(current => {
    const previous = previousCategorySpending.find(p => p.category === current.category);
    if (previous) {
      const change = ((current.amount - previous.amount) / previous.amount) * 100;
      if (Math.abs(change) > 20) {
        insights.push(
          `You spent ${Math.abs(change).toFixed(1)}% ${change > 0 ? 'more' : 'less'} on ${current.category} this month.`
        );
      }
    }
  });
  
  // Highest spending category
  if (currentCategorySpending.length > 0) {
    const highest = currentCategorySpending[0];
    insights.push(`${highest.category} is your highest spending category at ₹${highest.amount.toFixed(2)}.`);
  }
  
  // Savings suggestion
  if (currentCategorySpending.length > 2) {
    const thirdCategory = currentCategorySpending[2];
    const potentialSaving = thirdCategory.amount * 0.1;
    insights.push(
      `Reducing ${thirdCategory.category} by 10% can save ₹${potentialSaving.toFixed(2)} next month.`
    );
  }
  
  return insights;
}
