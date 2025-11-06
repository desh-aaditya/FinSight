'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  CreditCard,
  Building2,
  Car,
  Home,
  Loader2,
  RefreshCw,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { toast } from 'sonner';

interface CreditScoreData {
  creditScore: number;
  rating: string;
  ratingColor: string;
  ratingDescription: string;
  factors: Array<{
    name: string;
    score: number;
    weight: number;
    impact: string;
    description: string;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    impact: string;
  }>;
  trend: {
    direction: string;
    change: number;
  };
  metadata: {
    calculatedAt: string;
    transactionCount: number;
    accountAge: string;
    savingsGoalsCount: number;
  };
}

interface CIBILScoreData {
  cibilScore: number;
  rating: string;
  ratingColor: string;
  ratingDescription: string;
  factors: Array<{
    name: string;
    score: number;
    weight: number;
    impact: string;
    description: string;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    impact: string;
    priority: number;
  }>;
  loanEligibility: {
    personalLoan: boolean;
    homeLoan: boolean;
    carLoan: boolean;
    creditCard: boolean;
    message: string;
  };
  metadata: {
    calculatedAt: string;
    transactionCount: number;
    accountAge: string;
    avgMonthlyIncome: number;
    debtToIncomeRatio: string;
  };
}

export default function CreditScoresView() {
  const { user } = useAuth();
  const [creditData, setCreditData] = useState<CreditScoreData | null>(null);
  const [cibilData, setCibilData] = useState<CIBILScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchScores = async (showToast = false) => {
    if (!user) return;
    
    if (showToast) setRefreshing(true);
    
    try {
      const [creditResponse, cibilResponse] = await Promise.all([
        fetch(`/api/credit-score?userId=${user.id}`),
        fetch(`/api/cibil-score?userId=${user.id}`)
      ]);

      if (creditResponse.ok) {
        const creditJson = await creditResponse.json();
        setCreditData(creditJson);
      }

      if (cibilResponse.ok) {
        const cibilJson = await cibilResponse.json();
        setCibilData(cibilJson);
      }

      if (showToast) {
        toast.success('Scores refreshed successfully');
      }
    } catch (error) {
      console.error('Failed to fetch scores:', error);
      toast.error('Failed to load credit scores');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchScores();
    
    const interval = setInterval(() => fetchScores(), 30000);
    
    const handleRefresh = () => fetchScores();
    window.addEventListener('refreshData', handleRefresh);
    window.addEventListener('refreshAnalytics', handleRefresh);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('refreshData', handleRefresh);
      window.removeEventListener('refreshAnalytics', handleRefresh);
    };
  }, [user?.id]);

  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 60) return 'text-blue-600 dark:text-blue-400';
    if (percentage >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'bg-green-600';
    if (percentage >= 60) return 'bg-blue-600';
    if (percentage >= 40) return 'bg-orange-600';
    return 'bg-red-600';
  };

  const getImpactIcon = (impact: string) => {
    if (impact === 'positive') return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (impact === 'negative') return <AlertCircle className="h-4 w-4 text-red-600" />;
    return <Info className="h-4 w-4 text-blue-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Credit & CIBIL Scores
          </h2>
          <p className="text-muted-foreground mt-2">
            Monitor your financial health and creditworthiness
          </p>
        </div>
        <Button 
          onClick={() => fetchScores(true)} 
          disabled={refreshing}
          variant="outline"
        >
          {refreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh Scores
        </Button>
      </div>

      {/* Score Comparison Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Credit Score Card */}
        <Card className="relative overflow-hidden border-2">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-pink-500" />
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Credit Score (FICO Style)</CardTitle>
                <CardDescription>Range: 300-850</CardDescription>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {creditData ? (
              <>
                <div className="text-center space-y-2">
                  <div className={`text-6xl font-bold ${getScoreColor(creditData.creditScore, 850)}`}>
                    {creditData.creditScore}
                  </div>
                  <Badge variant="secondary" className="text-sm px-4 py-1">
                    {creditData.rating}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {creditData.ratingDescription}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm">
                  {creditData.trend.direction === 'up' ? (
                    <ArrowUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={creditData.trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}>
                    {creditData.trend.change} points from last calculation
                  </span>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">Score Factors</h4>
                  <div className="space-y-3">
                    {creditData.factors.map((factor, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            {getImpactIcon(factor.impact)}
                            <span className="font-medium">{factor.name}</span>
                            <span className="text-muted-foreground">({factor.weight}%)</span>
                          </div>
                          <span className="font-semibold">{factor.score}/100</span>
                        </div>
                        <Progress 
                          value={factor.score} 
                          className="h-2"
                        />
                        <p className="text-xs text-muted-foreground">{factor.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">Recommendations</h4>
                  <div className="space-y-2">
                    {creditData.recommendations.slice(0, 3).map((rec, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-accent">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                          <div>
                            <p className="font-medium text-sm">{rec.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                            <Badge variant="outline" className="mt-2 text-xs">
                              {rec.impact} Impact
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t space-y-1 text-xs text-muted-foreground">
                  <p>• Transactions: {creditData.metadata.transactionCount}</p>
                  <p>• Account Age: {creditData.metadata.accountAge}</p>
                  <p>• Last Updated: {new Date(creditData.metadata.calculatedAt).toLocaleString()}</p>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No credit score data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CIBIL Score Card */}
        <Card className="relative overflow-hidden border-2">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">CIBIL Score (India)</CardTitle>
                <CardDescription>Range: 300-900</CardDescription>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl">
                <Building2 className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {cibilData ? (
              <>
                <div className="text-center space-y-2">
                  <div className={`text-6xl font-bold ${getScoreColor(cibilData.cibilScore, 900)}`}>
                    {cibilData.cibilScore}
                  </div>
                  <Badge variant="secondary" className="text-sm px-4 py-1">
                    {cibilData.rating}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {cibilData.ratingDescription}
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">Loan Eligibility</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-lg border-2 ${cibilData.loanEligibility.personalLoan ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <CreditCard className="h-4 w-4" />
                        <span className="text-sm font-medium">Personal Loan</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {cibilData.loanEligibility.personalLoan ? 'Eligible ✓' : 'Not Eligible ✗'}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg border-2 ${cibilData.loanEligibility.homeLoan ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Home className="h-4 w-4" />
                        <span className="text-sm font-medium">Home Loan</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {cibilData.loanEligibility.homeLoan ? 'Eligible ✓' : 'Not Eligible ✗'}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg border-2 ${cibilData.loanEligibility.carLoan ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Car className="h-4 w-4" />
                        <span className="text-sm font-medium">Car Loan</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {cibilData.loanEligibility.carLoan ? 'Eligible ✓' : 'Not Eligible ✗'}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg border-2 ${cibilData.loanEligibility.creditCard ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <CreditCard className="h-4 w-4" />
                        <span className="text-sm font-medium">Credit Card</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {cibilData.loanEligibility.creditCard ? 'Eligible ✓' : 'Not Eligible ✗'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    {cibilData.loanEligibility.message}
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">Score Factors</h4>
                  <div className="space-y-3">
                    {cibilData.factors.map((factor, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            {getImpactIcon(factor.impact)}
                            <span className="font-medium">{factor.name}</span>
                            <span className="text-muted-foreground">({factor.weight}%)</span>
                          </div>
                          <span className="font-semibold">{factor.score}/100</span>
                        </div>
                        <Progress 
                          value={factor.score} 
                          className="h-2"
                        />
                        <p className="text-xs text-muted-foreground">{factor.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">Top Recommendations</h4>
                  <div className="space-y-2">
                    {cibilData.recommendations
                      .sort((a, b) => a.priority - b.priority)
                      .slice(0, 3)
                      .map((rec, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-accent">
                          <div className="flex items-start gap-2">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">
                              {rec.priority}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{rec.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                              <Badge variant="outline" className="mt-2 text-xs">
                                {rec.impact} Impact
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="pt-4 border-t space-y-1 text-xs text-muted-foreground">
                  <p>• Transactions: {cibilData.metadata.transactionCount}</p>
                  <p>• Account Age: {cibilData.metadata.accountAge}</p>
                  <p>• Avg Monthly Income: ₹{cibilData.metadata.avgMonthlyIncome.toLocaleString()}</p>
                  <p>• Debt-to-Income: {cibilData.metadata.debtToIncomeRatio}</p>
                  <p>• Last Updated: {new Date(cibilData.metadata.calculatedAt).toLocaleString()}</p>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No CIBIL score data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">About Credit Score (FICO)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Credit Score Range:</strong> 300-850
            </p>
            <p>
              Credit scores assess your overall financial responsibility and payment history. 
              Used globally, especially in the United States.
            </p>
            <div className="space-y-2 pt-2">
              <p><strong className="text-foreground">Rating Bands:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>800-850: Exceptional</li>
                <li>740-799: Very Good</li>
                <li>670-739: Good</li>
                <li>580-669: Fair</li>
                <li>300-579: Poor</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">About CIBIL Score (India)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">CIBIL Score Range:</strong> 300-900
            </p>
            <p>
              CIBIL scores are the standard creditworthiness metric used by Indian banks and 
              financial institutions for loan approvals.
            </p>
            <div className="space-y-2 pt-2">
              <p><strong className="text-foreground">Rating Bands:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>750-900: Excellent (Best rates)</li>
                <li>700-749: Good</li>
                <li>650-699: Fair</li>
                <li>550-649: Poor</li>
                <li>300-549: Very Poor</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Differences */}
      <Card>
        <CardHeader>
          <CardTitle>Key Differences Between Credit Score & CIBIL Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Aspect</th>
                  <th className="text-left p-3 font-semibold">Credit Score (FICO)</th>
                  <th className="text-left p-3 font-semibold">CIBIL Score</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-3 font-medium">Range</td>
                  <td className="p-3">300-850</td>
                  <td className="p-3">300-900</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Primary Market</td>
                  <td className="p-3">United States & Global</td>
                  <td className="p-3">India</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Excellent Score</td>
                  <td className="p-3">800+</td>
                  <td className="p-3">750+</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Payment History Weight</td>
                  <td className="p-3">35%</td>
                  <td className="p-3">30%</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Primary Focus</td>
                  <td className="p-3">Overall financial behavior</td>
                  <td className="p-3">Loan repayment capability</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
