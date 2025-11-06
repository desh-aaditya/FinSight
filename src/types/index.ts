export type TransactionCategory = 
  | 'Electronics'
  | 'Food & Dining'
  | 'Transportation'
  | 'Utilities & Bills'
  | 'Entertainment'
  | 'Healthcare'
  | 'Education'
  | 'Savings & Investments'
  | 'Crypto Investments'
  | 'Income'
  | 'Other';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  category: TransactionCategory;
  merchant: string;
  date: string;
  type: 'debit' | 'credit';
  description: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  balance: number;
  avatar: string;
}

export interface Budget {
  id: string;
  userId: string;
  category: TransactionCategory;
  limit: number;
  spent: number;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  icon: string;
}

export interface CryptoAsset {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  sparklineData: number[];
}
