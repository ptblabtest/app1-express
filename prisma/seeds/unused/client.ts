import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedClients() {
  try {
    await prisma.client.deleteMany();
    console.log('Truncated Client table data');


    await prisma.client.createMany({
      data: [
      ],
    });
    console.log('Seeded clients');

  } catch (error) {
    console.error('Error seeding clients:', error);
  }
}