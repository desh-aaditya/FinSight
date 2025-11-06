'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDataRefresh } from '@/contexts/DataRefreshContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { Budget, TransactionCategory } from '@/types';
import { Wallet, Plus, AlertTriangle, TrendingDown, Target, Loader2, Edit2, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

export default function BudgetPlannerView() {
  const { user } = useAuth();
  const { refreshKey } = useDataRefresh();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [addBudgetOpen, setAddBudgetOpen] = useState(false);
  const [editBudgetOpen, setEditBudgetOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [newCategory, setNewCategory] = useState<TransactionCategory>('Food & Dining');
  const [newLimit, setNewLimit] = useState('');
  const [editCategory, setEditCategory] = useState<TransactionCategory>('Food & Dining');
  const [editLimit, setEditLimit] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchBudgets = async () => {
    if (!user) return;
    
    try {
      const data = await api.getBudgets(user.id);
      setBudgets(data.budgets || []);
    } catch (error) {
      console.error('Failed to fetch budgets:', error);
      toast.error('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchBudgets, 10000);
    
    // Listen for refresh events
    const handleRefresh = () => fetchBudgets();
    window.addEventListener('refreshData', handleRefresh);
    window.addEventListener('refreshBudgets', handleRefresh);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('refreshData', handleRefresh);
      window.removeEventListener('refreshBudgets', handleRefresh);
    };
  }, [user?.id, refreshKey]);

  const handleAddBudget = async () => {
    const limitNum = parseFloat(newLimit);
    
    if (!limitNum || limitNum <= 0) {
      toast.error('Please enter a valid budget limit.');
      return;
    }

    try {
      await api.createBudget({
        userId: user!.id,
        category: newCategory,
        limitAmount: limitNum,
        spent: 0,
      });

      toast.success(`Budget limit of ₹${limitNum} set for ${newCategory}`);
      await fetchBudgets();
      
      setAddBudgetOpen(false);
      setNewLimit('');
    } catch (error) {
      console.error('Create budget error:', error);
      toast.error('Failed to create budget');
    }
  };

  const handleEditBudget = async () => {
    if (!editingBudget) return;
    
    const limitNum = parseFloat(editLimit);
    
    if (!limitNum || limitNum <= 0) {
      toast.error('Please enter a valid budget limit.');
      return;
    }

    try {
      await api.updateBudget(editingBudget.id, {
        category: editCategory,
        limitAmount: limitNum,
      });

      toast.success(`Budget updated successfully!`);
      await fetchBudgets();
      
      setEditBudgetOpen(false);
      setEditingBudget(null);
      setEditCategory('Food & Dining');
      setEditLimit('');
    } catch (error) {
      console.error('Update budget error:', error);
      toast.error('Failed to update budget');
    }
  };

  const handleDeleteBudget = async (budgetId: number, category: string) => {
    if (!confirm(`Are you sure you want to delete the budget for ${category}?`)) {
      return;
    }

    try {
      await api.deleteBudget(budgetId);
      toast.success(`Budget for ${category} deleted successfully`);
      await fetchBudgets();
    } catch (error) {
      console.error('Delete budget error:', error);
      toast.error('Failed to delete budget');
    }
  };

  const openEditDialog = (budget: Budget) => {
    setEditingBudget(budget);
    setEditCategory(budget.category);
    setEditLimit(budget.limitAmount.toString());
    setEditBudgetOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getBudgetStatus = (spent: number, limit: number) => {
    const percentage = (spent / limit) * 100;
    if (percentage >= 100) return { color: 'text-red-600', bg: 'bg-red-500', status: 'Over Budget' };
    if (percentage >= 80) return { color: 'text-orange-600', bg: 'bg-orange-500', status: 'Warning' };
    return { color: 'text-green-600', bg: 'bg-green-500', status: 'On Track' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalBudget = budgets.reduce((sum, b) => sum + b.limitAmount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const overBudgetCount = budgets.filter(b => b.spent >= b.limitAmount).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Budget Planner</h2>
          <p className="text-muted-foreground mt-1">Set spending limits and track your budget</p>
        </div>
        <Dialog open={addBudgetOpen} onOpenChange={setAddBudgetOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Budget</DialogTitle>
              <DialogDescription>Set a monthly spending limit for a category</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={newCategory} onValueChange={(value) => setNewCategory(value as TransactionCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Food & Dining">Food & Dining</SelectItem>
                    <SelectItem value="Transportation">Transportation</SelectItem>
                    <SelectItem value="Utilities & Bills">Utilities & Bills</SelectItem>
                    <SelectItem value="Entertainment">Entertainment</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Monthly Limit (₹)</Label>
                <Input
                  type="number"
                  placeholder="Enter budget limit"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                />
              </div>
              <Button onClick={handleAddBudget} className="w-full">
                Create Budget
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={editBudgetOpen} onOpenChange={setEditBudgetOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Budget</DialogTitle>
              <DialogDescription>Update budget limit for this category</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={editCategory} onValueChange={(value) => setEditCategory(value as TransactionCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Food & Dining">Food & Dining</SelectItem>
                    <SelectItem value="Transportation">Transportation</SelectItem>
                    <SelectItem value="Utilities & Bills">Utilities & Bills</SelectItem>
                    <SelectItem value="Entertainment">Entertainment</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Monthly Limit (₹)</Label>
                <Input
                  type="number"
                  placeholder="Enter budget limit"
                  value={editLimit}
                  onChange={(e) => setEditLimit(e.target.value)}
                />
              </div>
              <Button onClick={handleEditBudget} className="w-full">
                Update Budget
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Budget
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
            <p className="text-xs text-muted-foreground mt-1">Monthly limit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Spent
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalSpent)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalBudget > 0 ? `${((totalSpent / totalBudget) * 100).toFixed(1)}% of budget` : 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Remaining
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(Math.max(0, totalBudget - totalSpent))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Available to spend</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {overBudgetCount > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Budget Alert</AlertTitle>
          <AlertDescription>
            You have exceeded the budget limit in {overBudgetCount} {overBudgetCount === 1 ? 'category' : 'categories'}.
          </AlertDescription>
        </Alert>
      )}

      {/* Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgets.map((budget) => {
          const percentage = Math.min(100, (budget.spent / budget.limitAmount) * 100);
          const status = getBudgetStatus(budget.spent, budget.limitAmount);
          
          return (
            <Card key={budget.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{budget.category}</CardTitle>
                    <span className={`text-sm font-medium ${status.color}`}>{status.status}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditDialog(budget)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteBudget(budget.id, budget.category)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(budget.spent)}</p>
                    <p className="text-sm text-muted-foreground">of {formatCurrency(budget.limitAmount)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${status.color}`}>{percentage.toFixed(0)}%</p>
                    <p className="text-sm text-muted-foreground">Used</p>
                  </div>
                </div>
                <Progress value={percentage} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(Math.max(0, budget.limitAmount - budget.spent))} remaining this month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {budgets.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Budgets Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first budget to start tracking your spending
            </p>
            <Button onClick={() => setAddBudgetOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Budget
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}