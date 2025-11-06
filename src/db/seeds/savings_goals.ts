import { db } from '@/db';
import { savingsGoals } from '@/db/schema';

async function main() {
    const sampleSavingsGoals = [
        // User 1 (Aarav Sharma) goals
        {
            userId: 1,
            title: 'Emergency Fund',
            targetAmount: 150000,
            currentAmount: 75000,
            deadline: '2024-09-15',
            icon: '🎯',
            createdAt: new Date('2024-01-15').toISOString(),
            updatedAt: new Date('2024-05-10').toISOString(),
        },
        {
            userId: 1,
            title: 'Vacation Fund',
            targetAmount: 75000,
            currentAmount: 30000,
            deadline: '2024-12-20',
            icon: '✈️',
            createdAt: new Date('2024-02-01').toISOString(),
            updatedAt: new Date('2024-05-15').toISOString(),
        },
        {
            userId: 1,
            title: 'New Laptop',
            targetAmount: 80000,
            currentAmount: 56000,
            deadline: '2024-08-30',
            icon: '💻',
            createdAt: new Date('2024-01-20').toISOString(),
            updatedAt: new Date('2024-05-12').toISOString(),
        },
        // User 2 (Priya Verma) goals
        {
            userId: 2,
            title: 'New Home',
            targetAmount: 750000,
            currentAmount: 300000,
            deadline: '2025-03-15',
            icon: '🏠',
            createdAt: new Date('2024-01-10').toISOString(),
            updatedAt: new Date('2024-05-08').toISOString(),
        },
        {
            userId: 2,
            title: 'Wedding',
            targetAmount: 350000,
            currentAmount: 175000,
            deadline: '2024-11-30',
            icon: '💍',
            createdAt: new Date('2024-02-14').toISOString(),
            updatedAt: new Date('2024-05-20').toISOString(),
        },
        // User 3 (Rohit Patel) goals
        {
            userId: 3,
            title: 'New Car',
            targetAmount: 250000,
            currentAmount: 100000,
            deadline: '2024-10-15',
            icon: '🚗',
            createdAt: new Date('2024-01-25').toISOString(),
            updatedAt: new Date('2024-05-18').toISOString(),
        },
        {
            userId: 3,
            title: 'Emergency Fund',
            targetAmount: 180000,
            currentAmount: 54000,
            deadline: '2024-12-31',
            icon: '🎯',
            createdAt: new Date('2024-02-05').toISOString(),
            updatedAt: new Date('2024-05-22').toISOString(),
        },
        {
            userId: 3,
            title: 'Vacation Fund',
            targetAmount: 60000,
            currentAmount: 42000,
            deadline: '2024-07-30',
            icon: '✈️',
            createdAt: new Date('2024-03-01').toISOString(),
            updatedAt: new Date('2024-05-25').toISOString(),
        }
    ];

    await db.insert(savingsGoals).values(sampleSavingsGoals);
    
    console.log('✅ Savings goals seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});