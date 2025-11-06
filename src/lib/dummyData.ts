import { User, Transaction, Budget, SavingsGoal, CryptoAsset } from '@/types';

export const dummyUsers: User[] = [
  {
    id: 'user1',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    balance: 45230.50,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
  },
  {
    id: 'user2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password123',
    balance: 32450.75,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane'
  },
  {
    id: 'user3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    password: 'password123',
    balance: 18900.00,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike'
  }
];

export const generateDummyTransactions = (): Transaction[] => {
  const transactions: Transaction[] = [];
  const categories = [
    'Electronics',
    'Food & Dining',
    'Transportation',
    'Utilities & Bills',
    'Entertainment',
    'Healthcare',
    'Education',
    'Savings & Investments',
    'Crypto Investments'
  ];
  
  const merchants = {
    'Electronics': ['Amazon', 'Best Buy', 'Apple Store', 'Newegg'],
    'Food & Dining': ['Starbucks', 'McDonald\'s', 'Pizza Hut', 'Whole Foods', 'Local Restaurant'],
    'Transportation': ['Uber', 'Lyft', 'Gas Station', 'Public Transit'],
    'Utilities & Bills': ['Electric Company', 'Internet Provider', 'Water Company', 'Phone Bill'],
    'Entertainment': ['Netflix', 'Spotify', 'Cinema', 'Gaming Store'],
    'Healthcare': ['Pharmacy', 'Hospital', 'Dental Clinic', 'Health Insurance'],
    'Education': ['Online Course', 'University', 'Bookstore', 'Tutorial Platform'],
    'Savings & Investments': ['Investment Fund', 'Savings Account', 'Retirement Plan'],
    'Crypto Investments': ['Coinbase', 'Binance', 'Crypto Exchange']
  };

  // Generate transactions for the last 6 months
  const today = new Date();
  for (let i = 0; i < 180; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Generate 1-3 transactions per day
    const dailyTransactions = Math.floor(Math.random() * 3) + 1;
    
    for (let j = 0; j < dailyTransactions; j++) {
      const category = categories[Math.floor(Math.random() * categories.length)] as any;
      const merchantList = merchants[category as keyof typeof merchants] || ['Unknown'];
      const merchant = merchantList[Math.floor(Math.random() * merchantList.length)];
      const amount = Math.floor(Math.random() * 500) + 10;
      const userId = dummyUsers[Math.floor(Math.random() * dummyUsers.length)].id;
      
      transactions.push({
        id: `txn-${i}-${j}`,
        userId,
        amount,
        category,
        merchant,
        date: date.toISOString(),
        type: 'debit',
        description: `Payment to ${merchant}`
      });
    }
  }

  // Add some income transactions
  for (let i = 0; i < 6; i++) {
    const date = new Date(today);
    date.setMonth(date.getMonth() - i);
    date.setDate(1);
    
    dummyUsers.forEach(user => {
      transactions.push({
        id: `income-${i}-${user.id}`,
        userId: user.id,
        amount: Math.floor(Math.random() * 2000) + 5000,
        category: 'Income',
        merchant: 'Company Salary',
        date: date.toISOString(),
        type: 'credit',
        description: 'Monthly Salary'
      });
    });
  }

  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const dummyBudgets: Budget[] = [
  { id: 'budget1', userId: 'user1', category: 'Food & Dining', limit: 5000, spent: 3200 },
  { id: 'budget2', userId: 'user1', category: 'Entertainment', limit: 2000, spent: 1800 },
  { id: 'budget3', userId: 'user1', category: 'Transportation', limit: 3000, spent: 2100 },
  { id: 'budget4', userId: 'user1', category: 'Utilities & Bills', limit: 4000, spent: 3500 },
  { id: 'budget5', userId: 'user1', category: 'Electronics', limit: 3000, spent: 1200 },
];

export const dummySavingsGoals: SavingsGoal[] = [
  {
    id: 'goal1',
    userId: 'user1',
    title: 'Vacation to Europe',
    targetAmount: 50000,
    currentAmount: 32000,
    deadline: '2025-12-31',
    icon: '✈️'
  },
  {
    id: 'goal2',
    userId: 'user1',
    title: 'Emergency Fund',
    targetAmount: 100000,
    currentAmount: 65000,
    deadline: '2025-06-30',
    icon: '🏦'
  },
  {
    id: 'goal3',
    userId: 'user1',
    title: 'New Laptop',
    targetAmount: 80000,
    currentAmount: 45000,
    deadline: '2025-03-31',
    icon: '💻'
  }
];

export const dummyCryptoAssets: CryptoAsset[] = [
  {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    price: 42580.50,
    change24h: 2.5,
    sparklineData: [41000, 41500, 41200, 42000, 42300, 42100, 42580]
  },
  {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    price: 2245.30,
    change24h: -1.2,
    sparklineData: [2280, 2260, 2250, 2240, 2230, 2250, 2245]
  },
  {
    id: 'bnb',
    name: 'Binance Coin',
    symbol: 'BNB',
    price: 315.75,
    change24h: 3.8,
    sparklineData: [305, 308, 310, 312, 314, 313, 315]
  }
];
