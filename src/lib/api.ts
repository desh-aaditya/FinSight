// API utility functions for frontend
export const api = {
  // Users
  async getUser(userId: number) {
    const res = await fetch(`/api/users/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },

  async updateUser(userId: number, data: any) {
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update user');
    return res.json();
  },

  async loginUser(email: string, password: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Login failed');
    }
    return res.json();
  },

  // Transactions
  async getTransactions(userId: number, limit = 50, offset = 0) {
    const res = await fetch(`/api/transactions?userId=${userId}&limit=${limit}&offset=${offset}`);
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
  },

  async createTransaction(data: {
    userId: number;
    amount: number;
    category: string;
    merchant: string;
    date: string;
    type: 'debit' | 'credit';
    description?: string;
  }) {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create transaction');
    }
    return res.json();
  },

  async uploadCSV(userId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId.toString());

    const res = await fetch('/api/transactions/upload-csv', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to upload CSV');
    }
    return res.json();
  },

  // Budgets
  async getBudgets(userId: number) {
    const res = await fetch(`/api/budgets?userId=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch budgets');
    return res.json();
  },

  async createBudget(data: {
    userId: number;
    category: string;
    limitAmount: number;
    spent?: number;
  }) {
    const res = await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create budget');
    return res.json();
  },

  async updateBudget(budgetId: number, data: any) {
    const res = await fetch(`/api/budgets/${budgetId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update budget');
    return res.json();
  },

  async deleteBudget(budgetId: number) {
    const res = await fetch(`/api/budgets/${budgetId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete budget');
    return res.json();
  },

  // Savings Goals
  async getSavingsGoals(userId: number) {
    const res = await fetch(`/api/savings-goals?userId=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch savings goals');
    return res.json();
  },

  async createSavingsGoal(data: {
    userId: number;
    title: string;
    targetAmount: number;
    currentAmount?: number;
    deadline: string;
    icon?: string;
  }) {
    const res = await fetch('/api/savings-goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create savings goal');
    return res.json();
  },

  async updateSavingsGoal(goalId: number, data: any) {
    const res = await fetch(`/api/savings-goals/${goalId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update savings goal');
    return res.json();
  },

  async deleteSavingsGoal(goalId: number) {
    const res = await fetch(`/api/savings-goals/${goalId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete savings goal');
    return res.json();
  },

  // Analytics
  async getDashboardAnalytics(userId: number) {
    const res = await fetch(`/api/analytics/dashboard?userId=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch dashboard analytics');
    return res.json();
  },

  async getMonthlyTrend(userId: number) {
    const res = await fetch(`/api/analytics/monthly-trend?userId=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch monthly trend');
    return res.json();
  },

  // AI Advice
  async getAIAdvice(userId: number, question?: string) {
    const res = await fetch('/api/ai/advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, question }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to get AI advice');
    }
    return res.json();
  },

  // Credit Score
  async getCreditScore(userId: number) {
    const res = await fetch(`/api/credit-score?userId=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch credit score');
    return res.json();
  },
};

// Polling utility
export function usePolling(callback: () => void, interval: number = 5000) {
  if (typeof window === 'undefined') return;
  
  const id = setInterval(callback, interval);
  return () => clearInterval(id);
}