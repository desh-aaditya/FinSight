'use client';

import React, { createContext, useContext, useCallback, useState } from 'react';

interface DataRefreshContextType {
  refreshAll: () => void;
  refreshKey: number;
  refreshTransactions: () => void;
  refreshBudgets: () => void;
  refreshGoals: () => void;
  refreshAnalytics: () => void;
}

const DataRefreshContext = createContext<DataRefreshContextType | undefined>(undefined);

export function DataRefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshAll = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    // Dispatch custom event for components that need it
    window.dispatchEvent(new CustomEvent('refreshData'));
  }, []);

  const refreshTransactions = useCallback(() => {
    window.dispatchEvent(new CustomEvent('refreshTransactions'));
  }, []);

  const refreshBudgets = useCallback(() => {
    window.dispatchEvent(new CustomEvent('refreshBudgets'));
  }, []);

  const refreshGoals = useCallback(() => {
    window.dispatchEvent(new CustomEvent('refreshGoals'));
  }, []);

  const refreshAnalytics = useCallback(() => {
    window.dispatchEvent(new CustomEvent('refreshAnalytics'));
  }, []);

  return (
    <DataRefreshContext.Provider
      value={{
        refreshAll,
        refreshKey,
        refreshTransactions,
        refreshBudgets,
        refreshGoals,
        refreshAnalytics,
      }}
    >
      {children}
    </DataRefreshContext.Provider>
  );
}

export function useDataRefresh() {
  const context = useContext(DataRefreshContext);
  if (!context) {
    throw new Error('useDataRefresh must be used within DataRefreshProvider');
  }
  return context;
}
