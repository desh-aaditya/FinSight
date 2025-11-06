import { db } from '@/db';
import { users } from '@/db/schema';

async function main() {
    const sampleUsers = [
        {
            name: 'Aarav Sharma',
            email: 'aarav@example.com',
            password: 'password123',
            balance: 50000,
            avatar: null,
            createdAt: '2024-01-15T10:00:00Z',
        },
        {
            name: 'Priya Verma',
            email: 'priya@example.com',
            password: 'password123',
            balance: 75000,
            avatar: null,
            createdAt: '2024-01-16T14:30:00Z',
        },
        {
            name: 'Rohit Patel',
            email: 'rohit@example.com',
            password: 'password123',
            balance: 30000,
            avatar: null,
            createdAt: '2024-01-17T09:15:00Z',
        },
        {
            name: 'Sneha Iyer',
            email: 'sneha@example.com',
            password: 'password123',
            balance: 62000,
            avatar: null,
            createdAt: '2024-01-18T11:20:00Z',
        }
    ];

    await db.insert(users).values(sampleUsers);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});