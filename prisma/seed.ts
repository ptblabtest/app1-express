import { PrismaClient } from "../generated/prisma";
import { seedCategories } from "./seeds/categories";
import { seedRoles, seedUsers } from "./seeds/userTrials";
import { seedStageType } from "./seeds/stageType";
import { seedCostType } from "./seeds/costType";

const prisma = new PrismaClient();

async function main() {
  try {
    // Test database connection and check if tables exist
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    // Try to query each table to ensure they exist
    await prisma.role.findFirst();
    await prisma.user.findFirst();
    await prisma.category.findFirst();
    await prisma.stageType.findFirst();
    await prisma.costType.findFirst();

    console.log("✅ All required tables exist");
  } catch (error) {
    console.error("❌ Database or tables don't exist:", error);
    console.log(
      "Please run 'npx prisma migrate dev' or 'npx prisma db push' first"
    );
    await prisma.$disconnect();
    return;
  }

  const seeds = [
    { name: "Roles", fn: () => seedRoles(prisma) },
    { name: "Users", fn: () => seedUsers(prisma) },
    { name: "Categories", fn: () => seedCategories(prisma) },
    { name: "Stage Type", fn: () => seedStageType(prisma) },
    { name: "Cost Type", fn: () => seedCostType(prisma) },
  ];

  for (const { name, fn } of seeds) {
    try {
      console.log(`Seeding ${name}...`);
      await fn();
      console.log(`✅ ${name} seeded successfully.`);
    } catch (err) {
      console.error(`❌ Failed to seed ${name}:`, err);
    }
  }

  await prisma.$disconnect();
}

main();
