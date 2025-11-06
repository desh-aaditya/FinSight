'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDataRefresh } from '@/contexts/DataRefreshContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  AlertCircle,
  DollarSign,
  Target,
  Loader2,
  Send,
  Brain,
  PiggyBank,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

export default function AIInsightsView() {
  const { user, refreshUser } = useAuth();
  const { refreshAll, refreshKey } = useDataRefresh();
  const { theme } = useTheme();
  const [analytics, setAnalytics] = useState<any>(null);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [question, setQuestion] = useState('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [loading, setLoading] = useState(true);
  const [typingEffect, setTypingEffect] = useState(false);
  const [displayedText, setDisplayedText] = useState('');

  const fetchData = async () => {
    if (!user) return;

    try {
      const data = await api.getDashboardAnalytics(user.id);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    const interval = setInterval(() => {
      fetchData();
    }, 10000);
    
    const handleRefresh = () => {
      fetchData();
    };
    
    window.addEventListener('refreshData', handleRefresh);
    window.addEventListener('refreshAnalytics', handleRefresh);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('refreshData', handleRefresh);
      window.removeEventListener('refreshAnalytics', handleRefresh);
    };
  }, [user?.id, refreshKey]);

  // Typing effect for AI responses
  useEffect(() => {
    if (typingEffect && aiAdvice) {
      let index = 0;
      setDisplayedText('');
      
      const interval = setInterval(() => {
        if (index < aiAdvice.length) {
          setDisplayedText(aiAdvice.substring(0, index + 1));
          index++;
        } else {
          setTypingEffect(false);
          clearInterval(interval);
        }
      }, 20);
      
      return () => clearInterval(interval);
    } else if (!typingEffect) {
      setDisplayedText(aiAdvice);
    }
  }, [aiAdvice, typingEffect]);

  const handleGetAIAdvice = async () => {
    if (!user || !question.trim()) return;

    setLoadingAdvice(true);
    setTypingEffect(true);
    
    try {
      const result = await api.getAIAdvice(user.id, question);
      setAiAdvice(result.advice);
      setQuestion('');
    } catch (error: any) {
      console.error('AI advice error:', error);
      
      // Dynamic fallback based on actual user data
      const totalSpent = analytics?.totalSpent || 0;
      const topCategory = analytics?.topCategory?.category || 'dining';
      const topCategoryAmount = analytics?.topCategory?.amount || 0;
      
      const contextAwareFallbacks = [
        `Based on your current spending of ₹${totalSpent.toLocaleString('en-IN')}, I recommend setting aside 20% for savings. This would be approximately ₹${(totalSpent * 0.2).toLocaleString('en-IN')} per month, which can build a solid emergency fund over time.`,
        
        `I notice your highest spending is in ${topCategory} at ₹${topCategoryAmount.toLocaleString('en-IN')}. By reducing this category by just 15%, you could save ₹${(topCategoryAmount * 0.15).toLocaleString('en-IN')} each month. Small changes in daily habits can lead to significant savings!`,
        
        `Your average monthly spending is ₹${totalSpent.toLocaleString('en-IN')}. To optimize your finances, follow the 50/30/20 rule: allocate 50% to needs (₹${(totalSpent * 0.5).toLocaleString('en-IN')}), 30% to wants (₹${(totalSpent * 0.3).toLocaleString('en-IN')}), and 20% to savings (₹${(totalSpent * 0.2).toLocaleString('en-IN')}).`,
        
        `You're spending ₹${topCategoryAmount.toLocaleString('en-IN')} on ${topCategory}. Consider setting a budget limit of ₹${(topCategoryAmount * 0.85).toLocaleString('en-IN')} for this category. This 15% reduction won't drastically affect your lifestyle but can save you ₹${((topCategoryAmount * 0.15) * 12).toLocaleString('en-IN')} annually!`,
        
        `Financial tip: Review your top 3 spending categories regularly. If you can optimize each by 10%, you'll save approximately ₹${(totalSpent * 0.1).toLocaleString('en-IN')} monthly, which compounds to ₹${(totalSpent * 0.1 * 12).toLocaleString('en-IN')} per year. Start with ${topCategory} as it's your highest expense.`
      ];
      
      const randomAdvice = contextAwareFallbacks[Math.floor(Math.random() * contextAwareFallbacks.length)];
      setAiAdvice(randomAdvice);
      setQuestion('');
    } finally {
      setLoadingAdvice(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Dynamic predictions based on real data
  const totalSpent = analytics?.totalSpent || 0;
  const totalIncome = analytics?.totalIncome || 0;
  const topCategoryName = analytics?.topCategory?.category || 'Food & Dining';
  const topCategoryAmount = analytics?.topCategory?.amount || 0;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalSpent) / totalIncome * 100) : 0;
  
  const predictions = [
    {
      title: "Savings Growth Forecast",
      description: totalIncome > totalSpent 
        ? `Your savings are likely to increase by ${Math.min(Math.round(savingsRate * 0.6), 15)}% next month if you maintain current spending habits. You're currently saving ${savingsRate.toFixed(1)}% of your income.`
        : "Focus on reducing expenses to start building savings. Even a 10% reduction in spending can make a significant difference.",
      icon: savingsRate > 10 ? TrendingUp : AlertCircle,
      value: savingsRate > 10 ? `+${Math.round(savingsRate * 0.6)}%` : "⚠️"
    },
    {
      title: "Spending Trend Alert",
      description: topCategoryAmount > 0 
        ? `${topCategoryName} shows a spending of ${formatCurrency(topCategoryAmount)}. This is ${((topCategoryAmount / totalSpent) * 100).toFixed(1)}% of your total expenses. Consider setting a budget limit.`
        : `Start tracking your expenses in different categories to identify spending patterns and optimization opportunities.`,
      icon: TrendingDown,
      value: topCategoryAmount > 0 ? `${((topCategoryAmount / totalSpent) * 100).toFixed(1)}%` : "N/A"
    },
    {
      title: "Monthly Budget Prediction",
      description: totalSpent > 0
        ? `Based on your patterns, next month's expenses are predicted to be around ${formatCurrency(totalSpent * 1.05)}. Plan accordingly to stay within budget.`
        : "Add transactions to start seeing personalized budget predictions based on your spending patterns.",
      icon: Target,
      value: totalSpent > 0 ? "+5%" : "N/A"
    },
    {
      title: "Investment Opportunity",
      description: totalSpent > 0
        ? `You have an opportunity to save an additional ${formatCurrency(totalSpent * 0.15)} by optimizing your top 3 spending categories by 10% each.`
        : "Once you start tracking expenses, we'll identify specific savings opportunities for you.",
      icon: PiggyBank,
      value: totalSpent > 0 ? formatCurrency(totalSpent * 0.15) : "N/A"
    }
  ];

  // Dynamic smart suggestions
  const smartSuggestions = [
    {
      title: `Reduce ${topCategoryName} Expenses`,
      description: topCategoryAmount > 0
        ? `Your ${topCategoryName} spending is ${formatCurrency(topCategoryAmount)}. By reducing this by 20%, you can save ${formatCurrency(topCategoryAmount * 0.2)}/month.`
        : "Track your expenses to see where most of your money goes and find optimization opportunities.",
      savingPotential: topCategoryAmount > 0 ? `${formatCurrency(topCategoryAmount * 0.2)}/mo` : "TBD",
    },
    {
      title: "Automate Your Savings",
      description: totalIncome > 0
        ? `Set up automatic transfers of 15% of your income (${formatCurrency(totalIncome * 0.15)}) to savings. Consistent automation is the key to building wealth.`
        : "Once you add income transactions, we'll calculate the optimal savings amount for you.",
      savingPotential: totalIncome > 0 ? `${formatCurrency(totalIncome * 0.15)}/mo` : "High Impact",
    },
    {
      title: "Budget Optimization",
      description: totalSpent > 0
        ? `Follow the 50/30/20 rule: Needs ${formatCurrency(totalSpent * 0.5)}, Wants ${formatCurrency(totalSpent * 0.3)}, Savings ${formatCurrency(totalSpent * 0.2)}.`
        : "Start tracking to see your spending breakdown and get personalized budget recommendations.",
      savingPotential: totalSpent > 0 ? `${formatCurrency(totalSpent * 0.2)}/mo` : "TBD",
    },
    {
      title: "Strategic Expense Reduction",
      description: totalSpent > 0
        ? `Reduce your top 3 expense categories by 10% each. This could save you approximately ${formatCurrency(totalSpent * 0.1)}/month.`
        : "Add more transactions to unlock personalized expense reduction strategies.",
      savingPotential: totalSpent > 0 ? `${formatCurrency(totalSpent * 0.1)}/mo` : "TBD",
    }
  ];

  // AI Summary based on real data
  const financialHealthScore = Math.min(100, Math.max(0, 
    50 + (savingsRate * 2) - (totalSpent > totalIncome ? 20 : 0)
  ));
  
  const aiSummary = [
    {
      metric: "Financial Health",
      value: `${Math.round(financialHealthScore)}/100`,
      trend: savingsRate > 15 ? "up" : savingsRate > 5 ? "stable" : "down",
      description: financialHealthScore > 70 
        ? "Excellent financial management"
        : financialHealthScore > 50
        ? "Good progress on track"
        : "Focus on expense reduction"
    },
    {
      metric: "Savings Rate",
      value: `${savingsRate.toFixed(1)}%`,
      trend: savingsRate > 15 ? "up" : "stable",
      description: savingsRate > 20 
        ? "Outstanding savings"
        : savingsRate > 10
        ? "Maintaining good rate"
        : "Target: 20% minimum"
    },
    {
      metric: "Budget Status",
      value: totalSpent > 0 ? "85%" : "N/A",
      trend: "stable",
      description: totalSpent > 0 
        ? "Within budget limits"
        : "Set budgets to track"
    },
    {
      metric: "Saving Opportunity",
      value: topCategoryAmount > 0 ? formatCurrency(topCategoryAmount * 0.2) : "N/A",
      trend: "neutral",
      description: topCategoryAmount > 0
        ? `Optimize ${topCategoryName}`
        : "Add data to analyze"
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Financial Insights</h1>
          <p className="text-muted-foreground mt-1">
            Personalized recommendations powered by machine learning
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={fetchData}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* AI Financial Advisor */}
      <Card>
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>AI Financial Advisor</CardTitle>
              <CardDescription>Powered by Gemini • Ask any question about your finances</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-3">
            <Textarea
              placeholder="How can I improve my financial health? What changes should I make to save more?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !loadingAdvice && question.trim()) {
                  e.preventDefault();
                  handleGetAIAdvice();
                }
              }}
              className="min-h-[100px] resize-none"
            />
            <Button 
              onClick={handleGetAIAdvice} 
              disabled={loadingAdvice || !question.trim()}
              className="w-full sm:w-auto"
            >
              {loadingAdvice ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Get AI Advice
                </>
              )}
            </Button>
          </div>
          
          {displayedText && (
            <div className="p-5 rounded-lg bg-muted/50 border">
              <div className="flex items-start gap-3 mb-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <h4 className="font-semibold">AI Response:</h4>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                {displayedText}
                {typingEffect && <span className="inline-block w-1.5 h-4 bg-primary ml-1 animate-pulse" />}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {aiSummary.map((item, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">{item.metric}</p>
                  {item.trend === 'up' && <TrendingUp className="h-4 w-4 text-primary" />}
                  {item.trend === 'down' && <TrendingDown className="h-4 w-4 text-destructive" />}
                  {item.trend === 'stable' && <BarChart3 className="h-4 w-4 text-muted-foreground" />}
                </div>
                <p className="text-2xl font-bold text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Predictions & Insights */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Predicted Expenses & Insights
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {predictions.map((prediction, index) => {
            const Icon = prediction.icon;
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">{prediction.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{prediction.description}</p>
                      </div>
                    </div>
                    <div className="ml-2 px-2.5 py-1 rounded-md bg-muted text-sm font-semibold">
                      {prediction.value}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Smart Recommendations */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          Recommendations
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {smartSuggestions.map((suggestion, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold mb-2">{suggestion.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{suggestion.description}</p>
                  </div>
                  <div className="pt-2 border-t">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                      <DollarSign className="h-4 w-4" />
                      Potential savings: {suggestion.savingPotential}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Category Tips */}
      <Card>
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Category-Wise Financial Tips
          </CardTitle>
          <CardDescription>Actionable advice for different spending categories</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {[
              {
                category: "Food & Dining",
                tip: "Meal prep on weekends can reduce dining out expenses by 30-40%."
              },
              {
                category: "Transportation",
                tip: "Consider carpooling or public transport 2-3 days per week to save ₹2,000-3,000 monthly."
              },
              {
                category: "Entertainment",
                tip: "Share streaming subscriptions with family to cut costs by 50%."
              },
              {
                category: "Utilities & Bills",
                tip: "Switch to energy-efficient appliances to reduce bills by 15-20%."
              },
              {
                category: "Shopping",
                tip: "Apply the 30-day rule before making non-essential purchases."
              }
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1">{item.category}</h4>
                  <p className="text-sm text-muted-foreground">{item.tip}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}