'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { api } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  updateUserBalance: (newBalance: number) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('finsightUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const foundUser = await api.loginUser(email, password);
      
      if (foundUser) {
        setUser(foundUser);
        localStorage.setItem('finsightUser', JSON.stringify(foundUser));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('finsightUser');
  };

  const updateUserBalance = async (newBalance: number) => {
    if (user) {
      try {
        const updatedUser = await api.updateUser(user.id, { balance: newBalance });
        setUser(updatedUser);
        localStorage.setItem('finsightUser', JSON.stringify(updatedUser));
      } catch (error) {
        console.error('Failed to update balance:', error);
      }
    }
  };

  const refreshUser = async () => {
    if (user) {
      try {
        const updatedUser = await api.getUser(user.id);
        setUser(updatedUser);
        localStorage.setItem('finsightUser', JSON.stringify(updatedUser));
      } catch (error) {
        console.error('Failed to refresh user:', error);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated: !!user,
      updateUserBalance,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}