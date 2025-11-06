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
import { api } from '@/lib/api';
import { SavingsGoal } from '@/types';
import { Target, Plus, TrendingUp, Calendar, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SavingsGoalsView() {
  const { user } = useAuth();
  const { refreshKey, refreshAll } = useDataRefresh();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newIcon, setNewIcon] = useState('🎯');
  const [loading, setLoading] = useState(true);
  const [addFundsDialogOpen, setAddFundsDialogOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [fundsAmount, setFundsAmount] = useState('');

  const fetchGoals = async () => {
    if (!user) return;
    
    try {
      const data = await api.getSavingsGoals(user.id);
      setGoals(data.goals || []);
    } catch (error) {
      console.error('Failed to fetch savings goals:', error);
      toast.error('Failed to load savings goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchGoals, 10000);
    
    // Listen for refresh events
    const handleRefresh = () => fetchGoals();
    window.addEventListener('refreshData', handleRefresh);
    window.addEventListener('refreshGoals', handleRefresh);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('refreshData', handleRefresh);
      window.removeEventListener('refreshGoals', handleRefresh);
    };
  }, [user?.id, refreshKey]);

  const handleAddGoal = async () => {
    const targetNum = parseFloat(newTarget);
    
    if (!newTitle || !targetNum || targetNum <= 0 || !newDeadline) {
      toast.error('Please fill all fields with valid values.');
      return;
    }

    try {
      await api.createSavingsGoal({
        userId: user!.id,
        title: newTitle,
        targetAmount: targetNum,
        currentAmount: 0,
        deadline: newDeadline,
        icon: newIcon,
      });

      toast.success(`Savings goal "${newTitle}" created successfully!`);
      await fetchGoals();
      refreshAll();
      
      setAddGoalOpen(false);
      setNewTitle('');
      setNewTarget('');
      setNewDeadline('');
      setNewIcon('🎯');
    } catch (error) {
      console.error('Create goal error:', error);
      toast.error('Failed to create savings goal');
    }
  };

  const handleAddFunds = async () => {
    if (!selectedGoalId || !fundsAmount) return;
    
    const amount = parseFloat(fundsAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const goal = goals.find(g => g.id === selectedGoalId);
      if (!goal) return;

      const newAmount = Math.min(goal.targetAmount, goal.currentAmount + amount);
      
      await api.updateSavingsGoal(selectedGoalId, {
        currentAmount: newAmount,
      });

      toast.success(`₹${amount} added to your savings goal!`);
      
      // Immediate refresh
      await fetchGoals();
      refreshAll();
      
      setAddFundsDialogOpen(false);
      setSelectedGoalId(null);
      setFundsAmount('');
    } catch (error) {
      console.error('Add funds error:', error);
      toast.error('Failed to add funds');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysRemaining = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalTargetAmount = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalCurrentAmount = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Savings Goals</h2>
          <p className="text-muted-foreground mt-1">Track your progress towards financial goals</p>
        </div>
        <Dialog open={addGoalOpen} onOpenChange={setAddGoalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Savings Goal</DialogTitle>
              <DialogDescription>Set a new financial target to save for</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Goal Title</Label>
                <Input
                  placeholder="e.g., Vacation to Europe"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Target Amount (₹)</Label>
                <Input
                  type="number"
                  placeholder="Enter target amount"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="grid grid-cols-6 gap-2">
                  {['🎯', '✈️', '🏠', '🚗', '💻', '📱', '🎓', '💍', '🏖️', '🎉', '💰', '🏦'].map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewIcon(emoji)}
                      className={`p-2 text-2xl rounded border-2 transition-colors ${
                        newIcon === emoji ? 'border-primary bg-accent' : 'border-border hover:bg-accent'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={handleAddGoal} className="w-full">
                Create Goal
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
              Total Target
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalTargetAmount)}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all goals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Saved
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalCurrentAmount)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalTargetAmount > 0 ? `${((totalCurrentAmount / totalTargetAmount) * 100).toFixed(1)}% of target` : 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Goals
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{completedGoals}</div>
            <p className="text-xs text-muted-foreground mt-1">
              of {goals.length} {goals.length === 1 ? 'goal' : 'goals'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Funds Dialog */}
      <Dialog open={addFundsDialogOpen} onOpenChange={setAddFundsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Funds to Goal</DialogTitle>
            <DialogDescription>Enter the amount you want to add to your savings goal</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={fundsAmount}
                onChange={(e) => setFundsAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddFunds();
                  }
                }}
              />
            </div>
            <Button onClick={handleAddFunds} className="w-full">
              Add Funds
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((goal) => {
          const percentage = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
          const isCompleted = goal.currentAmount >= goal.targetAmount;
          const daysRemaining = getDaysRemaining(goal.deadline);
          
          return (
            <Card key={goal.id} className={isCompleted ? 'border-green-500 border-2' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{goal.icon}</div>
                    <div>
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {daysRemaining > 0
                            ? `${daysRemaining} days remaining`
                            : daysRemaining === 0
                            ? 'Due today'
                            : `${Math.abs(daysRemaining)} days overdue`}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isCompleted && (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(goal.currentAmount)}</p>
                    <p className="text-sm text-muted-foreground">of {formatCurrency(goal.targetAmount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-blue-600">{percentage.toFixed(0)}%</p>
                    <p className="text-sm text-muted-foreground">Complete</p>
                  </div>
                </div>
                <Progress value={percentage} className="h-3" />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(Math.max(0, goal.targetAmount - goal.currentAmount))} to go
                  </p>
                  {!isCompleted && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedGoalId(goal.id);
                        setAddFundsDialogOpen(true);
                      }}
                    >
                      Add Funds
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {goals.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Savings Goals Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first savings goal to start tracking your progress
            </p>
            <Button onClick={() => setAddGoalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Goal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}