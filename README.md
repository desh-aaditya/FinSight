# FinSight - Intelligent Money Management

A modern, AI-powered personal finance management platform built with Next.js 15, featuring ML-based predictions, voice input, and comprehensive financial analytics.

## 🎯 Features

### 💰 Financial Management
- **Dashboard Overview**: Real-time account balance, recent transactions, and key financial metrics
- **Transaction Management**: Add, import (CSV), and categorize transactions with ease
- **Budget Planner**: Set monthly spending limits per category with smart alerts
- **Savings Goals**: Track progress towards your financial targets with visual indicators

### 📊 Analytics & Insights
- **Interactive Charts**: Monthly trends, category-wise spending, income vs expenses
- **ML Predictions**: Machine learning-powered expense forecasting
- **AI Insights**: Personalized financial recommendations and spending analysis
- **Smart Analytics**: Identify top spending categories and merchants

### 🎤 Modern Features
- **Voice Input**: Add transactions using natural voice commands
- **Real-time Sync**: All data updates instantly across all dashboard modules
- **Dark Mode**: Elegant dark green theme for comfortable viewing
- **Responsive Design**: Seamless experience across all devices

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm, yarn, pnpm, or bun package manager

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd finsight
```

2. Install dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Set up environment variables
```bash
cp .env.example .env
```

4. Run database migrations
```bash
npm run db:push
```

5. Start the development server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## 👥 Demo Accounts

Use these credentials to test the application:

- **Aarav Sharma**: aarav@example.com / password123
- **Priya Verma**: priya@example.com / password123
- **Rohit Patel**: rohit@example.com / password123
- **Sneha Iyer**: sneha@example.com / password123

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn/UI + Radix UI
- **Database**: Turso (SQLite)
- **ORM**: Drizzle ORM
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Icons**: Lucide React

## 📁 Project Structure

```
finsight/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── api/          # API routes
│   │   ├── page.tsx      # Homepage
│   │   └── layout.tsx    # Root layout
│   ├── components/       # React components
│   │   └── ui/           # Shadcn UI components
│   ├── contexts/         # React context providers
│   ├── db/               # Database schema and seeds
│   ├── lib/              # Utility functions
│   └── types/            # TypeScript type definitions
├── public/               # Static assets
└── drizzle/              # Database migrations
```

## 🎨 Key Features Explained

### Real-Time Data Synchronization
All dashboard modules are connected through a global `DataRefreshContext` that ensures instant updates across:
- Transaction additions (manual, voice, CSV)
- Budget modifications
- Savings goal updates
- Analytics and predictions

### Voice Input
Powered by Web Speech API, allowing natural language transaction entry like:
- "Add 500 rupees spent on groceries today"
- "I paid 1200 for electricity bill"

### ML Predictions
Uses linear regression to forecast future expenses based on historical transaction patterns.

## 📊 Database Management

Access the database studio to manage your data:
- Click the "Database Studio" tab in the top navigation
- View and edit users, transactions, budgets, and savings goals

## 🔐 Security Note

This is a demo application with simplified authentication. For production use:
- Implement proper password hashing (bcrypt)
- Add JWT or session-based authentication
- Enable HTTPS
- Add rate limiting
- Implement CSRF protection

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📧 Support

For support, email [your-email] or open an issue in the repository.

---

Built with ❤️ using Next.js and TypeScript