'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDataRefresh } from '@/contexts/DataRefreshContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Loader2, TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

export default function AnalyticsView() {
  const { user } = useAuth();
  const { refreshKey } = useDataRefresh();
  const { theme } = useTheme();
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    if (!user) return;
    
    try {
      const data = await api.getMonthlyTrend(user.id);
      setMonthlyTrend(data.trend || []);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    
    // Poll for updates every 5 seconds for instant updates
    const interval = setInterval(fetchAnalytics, 5000);
    
    // Listen for refresh events
    const handleRefresh = () => fetchAnalytics();
    window.addEventListener('refreshData', handleRefresh);
    window.addEventListener('refreshAnalytics', handleRefresh);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('refreshData', handleRefresh);
      window.removeEventListener('refreshAnalytics', handleRefresh);
    };
  }, [user?.id, refreshKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Theme-aware colors
  const isDark = theme === 'dark';
  const CHART_COLORS = isDark 
    ? ['#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e']
    : ['#16a34a', '#059669', '#0d9488', '#0891b2', '#2563eb', '#4f46e5', '#7c3aed', '#9333ea', '#db2777', '#e11d48'];

  const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const textColor = isDark ? '#e5e7eb' : '#374151';
  const tooltipBg = isDark ? '#1f2937' : '#ffffff';
  const tooltipBorder = isDark ? '#374151' : '#e5e7eb';

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  // Calculate category spending from monthly trend
  const categorySpending = monthlyTrend.length > 0 && monthlyTrend[monthlyTrend.length - 1].categories 
    ? Object.entries(monthlyTrend[monthlyTrend.length - 1].categories).map(([category, amount]) => ({
        category,
        amount: amount as number,
        percentage: 0
      }))
    : [];

  const totalSpending = categorySpending.reduce((sum, cat) => sum + cat.amount, 0);
  categorySpending.forEach(cat => {
    cat.percentage = totalSpending > 0 ? (cat.amount / totalSpending) * 100 : 0;
  });

  // Sort by amount descending
  categorySpending.sort((a, b) => b.amount - a.amount);

  // Prepare income vs expenditure data
  const incomeVsExpenditure = monthlyTrend.map(item => ({
    month: item.month,
    income: item.income || 0,
    expenditure: item.expenditure || 0,
  }));

  // Custom tooltip for better UX
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div 
          className="rounded-lg border shadow-lg p-3 transition-all"
          style={{ 
            backgroundColor: tooltipBg,
            borderColor: tooltipBorder
          }}
        >
          <p className="font-semibold mb-2" style={{ color: textColor }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const hasData = monthlyTrend.length > 0;

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
              <BarChart3 className="h-7 w-7 text-primary" />
            </div>
            Financial Analytics
          </h2>
          <p className="text-muted-foreground mt-2 text-base">
            Real-time insights into your spending patterns • Auto-updates every 5 seconds
          </p>
        </div>
        {hasData && (
          <div className="px-4 py-2 bg-primary/10 rounded-full">
            <span className="flex items-center gap-2 text-sm font-medium text-primary">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              Live Data
            </span>
          </div>
        )}
      </div>

      {!hasData ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 bg-muted rounded-full mb-4">
              <BarChart3 className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Not enough data to display charts yet</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Add some transactions to start seeing your financial analytics. Charts will appear automatically once data is available.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Monthly Trend Chart */}
          <Card className="border-2 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Monthly Trend</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Track your spending over time</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={monthlyTrend}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis 
                    dataKey="month" 
                    stroke={textColor}
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke={textColor}
                    style={{ fontSize: '12px' }}
                    tickFormatter={formatCurrency}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ color: textColor }} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke={CHART_COLORS[0]}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorAmount)"
                    name="Expenditure"
                    animationDuration={800}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category-wise Spending */}
            <Card className="border-2 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <PieChartIcon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">Category Distribution</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Where your money goes</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={categorySpending}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      label={({ category, percentage }) => `${category} (${percentage.toFixed(1)}%)`}
                      labelLine={true}
                      animationDuration={800}
                    >
                      {categorySpending.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Income vs Expenditure */}
            <Card className="border-2 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">Income vs Expenditure</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Monthly comparison</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={incomeVsExpenditure}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis 
                      dataKey="month" 
                      stroke={textColor}
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke={textColor}
                      style={{ fontSize: '12px' }}
                      tickFormatter={formatCurrency}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ color: textColor }} />
                    <Bar 
                      dataKey="income" 
                      fill={isDark ? '#22c55e' : '#16a34a'} 
                      name="Income"
                      radius={[8, 8, 0, 0]}
                      animationDuration={800}
                    />
                    <Bar 
                      dataKey="expenditure" 
                      fill={isDark ? '#ef4444' : '#dc2626'} 
                      name="Expenditure"
                      radius={[8, 8, 0, 0]}
                      animationDuration={800}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown Table */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-xl">Spending Breakdown by Category</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Detailed view of your expenses</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categorySpending.map((category, index) => (
                  <div key={category.category} className="animate-in fade-in slide-in-from-left duration-500" style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <span className="font-semibold">{category.category}</span>
                      </div>
                      <span className="text-sm font-medium">
                        {formatCurrency(category.amount)} ({category.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                      <div
                        className="h-3 rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${category.percentage}%`,
                          backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}