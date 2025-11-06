import { db } from '@/db';
import { budgets } from '@/db/schema';

async function main() {
    const sampleBudgets = [
        // User 1 (Aarav Sharma) budgets
        {
            userId: 1,
            category: 'Food & Dining',
            limitAmount: 6500,
            spent: 4550,
            createdAt: new Date('2024-11-01').toISOString(),
            updatedAt: new Date('2025-01-15').toISOString(),
        },
        {
            userId: 1,
            category: 'Transportation',
            limitAmount: 4000,
            spent: 3200,
            createdAt: new Date('2024-11-01').toISOString(),
            updatedAt: new Date('2025-01-15').toISOString(),
        },
        {
            userId: 1,
            category: 'Entertainment',
            limitAmount: 2500,
            spent: 1800,
            createdAt: new Date('2024-11-01').toISOString(),
            updatedAt: new Date('2025-01-15').toISOString(),
        },
        {
            userId: 1,
            category: 'Utilities & Bills',
            limitAmount: 3500,
            spent: 3150,
            createdAt: new Date('2024-11-01').toISOString(),
            updatedAt: new Date('2025-01-15').toISOString(),
        },
        // User 2 (Priya Verma) budgets
        {
            userId: 2,
            category: 'Food & Dining',
            limitAmount: 7500,
            spent: 5625,
            createdAt: new Date('2024-11-05').toISOString(),
            updatedAt: new Date('2025-01-18').toISOString(),
        },
        {
            userId: 2,
            category: 'Electronics',
            limitAmount: 4500,
            spent: 3600,
            createdAt: new Date('2024-11-05').toISOString(),
            updatedAt: new Date('2025-01-18').toISOString(),
        },
        {
            userId: 2,
            category: 'Healthcare',
            limitAmount: 3500,
            spent: 2100,
            createdAt: new Date('2024-11-05').toISOString(),
            updatedAt: new Date('2025-01-18').toISOString(),
        },
        {
            userId: 2,
            category: 'Transportation',
            limitAmount: 4500,
            spent: 3825,
            createdAt: new Date('2024-11-05').toISOString(),
            updatedAt: new Date('2025-01-18').toISOString(),
        },
        {
            userId: 2,
            category: 'Education',
            limitAmount: 5000,
            spent: 2500,
            createdAt: new Date('2024-11-05').toISOString(),
            updatedAt: new Date('2025-01-18').toISOString(),
        },
        // User 3 (Rohit Patel) budgets
        {
            userId: 3,
            category: 'Food & Dining',
            limitAmount: 5500,
            spent: 4950,
            createdAt: new Date('2024-11-10').toISOString(),
            updatedAt: new Date('2025-01-20').toISOString(),
        },
        {
            userId: 3,
            category: 'Entertainment',
            limitAmount: 2000,
            spent: 1600,
            createdAt: new Date('2024-11-10').toISOString(),
            updatedAt: new Date('2025-01-20').toISOString(),
        },
        {
            userId: 3,
            category: 'Utilities & Bills',
            limitAmount: 3000,
            spent: 2700,
            createdAt: new Date('2024-11-10').toISOString(),
            updatedAt: new Date('2025-01-20').toISOString(),
        },
        {
            userId: 3,
            category: 'Healthcare',
            limitAmount: 3800,
            spent: 1520,
            createdAt: new Date('2024-11-10').toISOString(),
            updatedAt: new Date('2025-01-20').toISOString(),
        },
    ];

    await db.insert(budgets).values(sampleBudgets);
    
    console.log('✅ Budgets seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});