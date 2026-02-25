import { PrismaClient } from '@prisma/client';
import { getTransactionEmbedding } from '../src/lib/extractor';

const prisma = new PrismaClient();

async function main() {
  // 1. Create a dummy user
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: 'hashed_password_here', // In a real app, use bcrypt
      name: 'Test User',
      organizationId: 'org_123',
    },
  });

  console.log('User created:', user.email);

  // 2. Sample Transactions to seed
  const samples = [
    { desc: 'Starbucks Coffee', amt: 5.50, cat: 'Food & Dining' },
    { desc: 'Uber Ride to Airport', amt: 35.00, cat: 'Transport' },
    { desc: 'Netflix Subscription', amt: 15.99, cat: 'Utilities' },
    { desc: 'Amazon - New Headphones', amt: 120.00, cat: 'Shopping' },
  ];

  for (const s of samples) {
    const vector = await getTransactionEmbedding(s.desc, s.cat);
    
    const record = await prisma.transaction.create({
      data: {
        description: s.desc,
        amount: s.amt,
        category: s.cat,
        date: new Date(),
        userId: user.id,
        organizationId: user.organizationId,
        confidence: 1.0,
      }
    });

    // Manually inject the vector
    await prisma.$executeRaw`
      UPDATE "Transaction" SET embedding = ${vector}::vector WHERE id = ${record.id}
    `;
  }

  console.log('Database seeded with AI vectors!');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());