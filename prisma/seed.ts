import { PrismaClient } from "../generated/prisma";
import { seedOrganizations } from "./seeds/organization";
import { seedRoles, seedUsers } from "./seeds/userTrials";
// import { seedCountries } from "./seeds/countries";
// import { seedStageType } from "./seeds/stageType";
// import { seedProducts } from "./seeds/products";
// import { seedCostType } from "./seeds/costType";
// import { seedCategories } from "./seeds/categories";

const prisma = new PrismaClient();

async function main() {
  const seeds = [
    // { name: "Countries", fn: () => seedCountries(prisma) },
    // { name: "Stage Type", fn: () => seedStageType(prisma) },
    // { name: "Cost Type", fn: () => seedCostType(prisma) },
    // { name: "Categories", fn: () => seedCategories(prisma) },
    // { name: "Products", fn: () => seedProducts(prisma) },
    { name: "Roles", fn: () => seedRoles(prisma) },
    { name: "Users", fn: () => seedUsers(prisma) },
    { name: "Organizations", fn: () => seedOrganizations(prisma) },
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
