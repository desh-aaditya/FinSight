'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDataRefresh } from '@/contexts/DataRefreshContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { Transaction, TransactionCategory } from '@/types';
import { Search, Send, Upload, Download, Filter, ArrowUpRight, ArrowDownRight, Loader2, Plus, Mic } from 'lucide-react';
import { toast } from 'sonner';
import VoiceInput from './VoiceInput';

export default function TransactionsView() {
  const { user, refreshUser } = useAuth();
  const { refreshAll } = useDataRefresh();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sendMoneyOpen, setSendMoneyOpen] = useState(false);
  const [addTransactionOpen, setAddTransactionOpen] = useState(false);
  const [voiceInputOpen, setVoiceInputOpen] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Manual transaction form fields
  const [transactionName, setTransactionName] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionCategory, setTransactionCategory] = useState<TransactionCategory>('Food & Dining');
  const [transactionType, setTransactionType] = useState<'debit' | 'credit'>('debit');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchTransactions = async () => {
    if (!user) return;
    
    try {
      const data = await api.getTransactions(user.id, 100, 0);
      setTransactions(data.transactions || []);
      setFilteredTransactions(data.transactions || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchTransactions, 10000);
    
    // Listen for refresh events
    const handleRefresh = () => fetchTransactions();
    window.addEventListener('refreshData', handleRefresh);
    window.addEventListener('refreshTransactions', handleRefresh);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('refreshData', handleRefresh);
      window.removeEventListener('refreshTransactions', handleRefresh);
    };
  }, [user?.id]);

  useEffect(() => {
    let filtered = transactions;

    if (searchTerm) {
      filtered = filtered.filter(
        t =>
          t.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }

    setFilteredTransactions(filtered);
  }, [searchTerm, categoryFilter, transactions]);

  const handleAddTransaction = async () => {
    const amountNum = parseFloat(transactionAmount);
    
    if (!transactionName || !amountNum || amountNum <= 0) {
      toast.error('Please enter a valid transaction name and amount.');
      return;
    }

    try {
      await api.createTransaction({
        userId: user!.id,
        amount: amountNum,
        category: transactionCategory,
        merchant: transactionName,
        date: transactionDate,
        type: transactionType,
        description: `${transactionType === 'credit' ? 'Income' : 'Expense'}: ${transactionName}`,
      });

      toast.success(`Transaction added successfully!`);
      
      // Trigger global refresh
      await fetchTransactions();
      await refreshUser();
      refreshAll();
      
      setAddTransactionOpen(false);
      setTransactionName('');
      setTransactionAmount('');
      setTransactionCategory('Food & Dining');
      setTransactionType('debit');
      setTransactionDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      console.error('Add transaction error:', error);
      toast.error('Failed to add transaction');
    }
  };

  const handleSendMoney = async () => {
    const amountNum = parseFloat(amount);
    
    if (!recipient || !amountNum || amountNum <= 0) {
      toast.error('Please enter a valid recipient and amount.');
      return;
    }

    if (amountNum > (user?.balance || 0)) {
      toast.error('Insufficient balance for this transaction.');
      return;
    }

    try {
      await api.createTransaction({
        userId: user!.id,
        amount: amountNum,
        category: 'Other',
        merchant: recipient,
        date: new Date().toISOString().split('T')[0],
        type: 'debit',
        description: `Money transfer to ${recipient}`,
      });

      toast.success(`₹${amountNum} sent to ${recipient}`);
      
      // Trigger global refresh
      await fetchTransactions();
      await refreshUser();
      refreshAll();
      
      setSendMoneyOpen(false);
      setRecipient('');
      setAmount('');
    } catch (error) {
      console.error('Send money error:', error);
      toast.error('Failed to send money');
    }
  };

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
      await fetchTransactions();
      await refreshUser();
      refreshAll();
    } catch (error) {
      console.error('Voice transaction error:', error);
      toast.error('Failed to add transaction');
    }
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const result = await api.uploadCSV(user.id, file);
      
      toast.success(
        `${result.imported} transactions imported successfully! Balance updated: ${result.balanceChange > 0 ? '+' : ''}₹${result.balanceChange.toFixed(2)}`
      );
      
      if (result.errors && result.errors.length > 0) {
        toast.warning(`${result.errors.length} rows had errors`);
      }
      
      // Trigger global refresh
      await fetchTransactions();
      await refreshUser();
      refreshAll();
    } catch (error: any) {
      console.error('CSV import error:', error);
      toast.error(error.message || 'Failed to import CSV');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Category', 'Amount', 'Merchant', 'Type', 'Description'];
    const rows = filteredTransactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.category,
      t.amount.toString(),
      t.merchant,
      t.type,
      t.description || '',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${Date.now()}.csv`;
    a.click();
    toast.success('Transactions exported successfully');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Transaction Management</h2>
          <p className="text-muted-foreground mt-1">Track and manage all your transactions</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Dialog open={addTransactionOpen} onOpenChange={setAddTransactionOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Transaction Manually</DialogTitle>
                <DialogDescription>Enter transaction details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Transaction Name</Label>
                  <Input
                    placeholder="e.g., Grocery Shopping"
                    value={transactionName}
                    onChange={(e) => setTransactionName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={transactionAmount}
                    onChange={(e) => setTransactionAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={transactionCategory} onValueChange={(value) => setTransactionCategory(value as TransactionCategory)}>
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
                      <SelectItem value="Savings & Investments">Savings & Investments</SelectItem>
                      <SelectItem value="Income">Income</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={transactionType} onValueChange={(value) => setTransactionType(value as 'debit' | 'credit')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debit">Expense</SelectItem>
                      <SelectItem value="credit">Income</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddTransaction} className="w-full">
                  Add Transaction
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={voiceInputOpen} onOpenChange={setVoiceInputOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="relative animate-pulse">
                <Mic className="mr-2 h-4 w-4" />
                Voice Input
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Voice Transaction Input</DialogTitle>
                <DialogDescription>Add transactions using your voice</DialogDescription>
              </DialogHeader>
              <VoiceInput onTransactionAdd={handleVoiceTransaction} />
            </DialogContent>
          </Dialog>

          <Dialog open={sendMoneyOpen} onOpenChange={setSendMoneyOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Send className="mr-2 h-4 w-4" />
                Send Money
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Money</DialogTitle>
                <DialogDescription>Transfer money to another account</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Recipient Name</Label>
                  <Input
                    placeholder="Enter recipient name"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <Button onClick={handleSendMoney} className="w-full">
                  Send ₹{amount || '0'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={() => document.getElementById('csv-import')?.click()} disabled={uploading}>
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Import CSV
          </Button>
          <input
            id="csv-import"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleCSVImport}
          />

          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Food & Dining">Food & Dining</SelectItem>
                <SelectItem value="Transportation">Transportation</SelectItem>
                <SelectItem value="Utilities & Bills">Utilities & Bills</SelectItem>
                <SelectItem value="Entertainment">Entertainment</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
                <SelectItem value="Income">Income</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { setSearchTerm(''); setCategoryFilter('all'); }}>
              <Filter className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions ({filteredTransactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredTransactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No transactions found</p>
            ) : (
              filteredTransactions.map((transaction) => (
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
    </div>
  );
}