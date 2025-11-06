'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDataRefresh } from '@/contexts/DataRefreshContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { Transaction, TransactionCategory } from '@/types';
import { Wallet, TrendingUp, TrendingDown, Activity, ArrowUpRight, ArrowDownRight, Loader2, Mic } from 'lucide-react';
import CryptoWidget from './CryptoWidget';
import VoiceInput from './VoiceInput';
import { toast } from 'sonner';

export default function DashboardOverview() {
  const { user, refreshUser } = useAuth();
  const { refreshKey, refreshAll } = useDataRefresh();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [voiceInputOpen, setVoiceInputOpen] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      const [analyticsData, transactionsData] = await Promise.all([
        api.getDashboardAnalytics(user.id),
        api.getTransactions(user.id, 5, 0)
      ]);
      
      setAnalytics(analyticsData);
      setTransactions(transactionsData.transactions || []);
      await refreshUser();
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchData, 10000);
    
    // Listen for refresh events
    const handleRefresh = () => fetchData();
    window.addEventListener('refreshData', handleRefresh);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('refreshData', handleRefresh);
    };
  }, [user?.id, refreshKey]);

  const handleVoiceTransaction = async (amount: number, category: TransactionCategory, description: string) => {
    if (!user) return;

    try {
      await api.createTransaction({
        userId: user.id,
        amount,
        category,
        merchant: 'Voice Transaction',
        date: new Date().toISOString().split('T')[0],
        type: 'debit',
        description,
      });

      toast.success(`Transaction of ₹${amount} added via voice!`);
      
      // Trigger global refresh
      await fetchData();
      await refreshUser();
      refreshAll();
      
      setVoiceInputOpen(false);
    } catch (error) {
      console.error('Voice transaction error:', error);
      toast.error('Failed to add transaction');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Electronics': 'bg-blue-500',
      'Food & Dining': 'bg-orange-500',
      'Transportation': 'bg-green-500',
      'Utilities & Bills': 'bg-yellow-500',
      'Entertainment': 'bg-purple-500',
      'Healthcare': 'bg-red-500',
      'Education': 'bg-indigo-500',
      'Savings & Investments': 'bg-emerald-500',
      'Crypto Investments': 'bg-cyan-500',
      'Income': 'bg-green-600',
    };
    return colors[category] || 'bg-gray-500';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Welcome back, {user?.name}! 👋</h2>
          <p className="text-muted-foreground mt-1">Here's your financial overview for {currentMonth}</p>
        </div>
        
        <Dialog open={voiceInputOpen} onOpenChange={setVoiceInputOpen}>
          <DialogTrigger asChild>
            <Button className="relative animate-pulse">
              <Mic className="mr-2 h-4 w-4" />
              Quick Add by Voice
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Voice Transaction Input</DialogTitle>
              <DialogDescription>Add transactions quickly using your voice</DialogDescription>
            </DialogHeader>
            <VoiceInput onTransactionAdd={handleVoiceTransaction} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Account Balance
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(user?.balance || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Available balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Spent
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(analytics?.totalSpent || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Income
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(analytics?.totalIncome || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top Category
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.topCategory?.category || 'N/A'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics?.topCategory ? formatCurrency(analytics.topCategory.amount) : 'No data'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No transactions yet</p>
              ) : (
                transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full ${getCategoryColor(transaction.category)} flex items-center justify-center`}>
                        {transaction.type === 'credit' ? (
                          <ArrowDownRight className="h-5 w-5 text-white" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.merchant}</p>
                        <p className="text-sm text-muted-foreground">{transaction.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Crypto Widget */}
        <div className="lg:col-span-1">
          <CryptoWidget />
        </div>
      </div>
    </div>
  );
}