'use client';

import React, { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { DataRefreshProvider } from '@/contexts/DataRefreshContext';
import LoginPage from '@/components/LoginPage';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardOverview from '@/components/DashboardOverview';
import AnalyticsView from '@/components/AnalyticsView';
import TransactionsView from '@/components/TransactionsView';
import CreditScoresView from '@/components/CreditScoresView';
import PredictionsView from '@/components/PredictionsView';
import BudgetPlannerView from '@/components/BudgetPlannerView';
import SavingsGoalsView from '@/components/SavingsGoalsView';
import AIInsightsView from '@/components/AIInsightsView';
import ProfileView from '@/components/ProfileView';
import { Toaster } from '@/components/ui/sonner';

function DashboardContent() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'analytics':
        return <AnalyticsView />;
      case 'transactions':
        return <TransactionsView />;
      case 'credit-scores':
        return <CreditScoresView />;
      case 'predictions':
        return <PredictionsView />;
      case 'budget':
        return <BudgetPlannerView />;
      case 'goals':
        return <SavingsGoalsView />;
      case 'insights':
        return <AIInsightsView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <DataRefreshProvider>
          <DashboardContent />
          <Toaster />
        </DataRefreshProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}