import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedAccounts() {
  try {
    await prisma.account.deleteMany();
    console.log("Truncated Account table data");

    await prisma.$executeRaw`ALTER TABLE Product AUTO_INCREMENT = 1;`;

    await prisma.account.createMany({
      data: [
        {
          accountNumber: "512006",
          accountName: "HOK (Carbon)",
        },
        {
          accountNumber: "512006",
          accountName: "HOK (Biodiv)",
        },
        {
          accountNumber: "512006",
          accountName: "HOK (Suporting)",
        },
        {
          accountNumber: "512014",
          accountName: "First Aid",
        },
        {
          accountNumber: "512013",
          accountName: "Meals Expense",
        },
        {
          accountNumber: "512003",
          accountName: "Transportation Expense (Mobil)",
        },
        {
          accountNumber: "512003",
          accountName: "Transportation Expense (Motor)",
        },
        {
          accountNumber: "512003",
          accountName: "Transportation Expense (Bus)",
        },
        {
          accountNumber: "512003",
          accountName: "Airport Transportation",
        },
        {
          accountNumber: "512003",
          accountName: "Flight Expenses (National)",
        },
        {
          accountNumber: "512017",
          accountName: "Over Baggage",
        },
        {
          accountNumber: "512006",
          accountName: "DSA Expense",
        },
        {
          accountNumber: "512004",
          accountName: "Accomodation Expense (Hotel)",
        },
        {
          accountNumber: "512004",
          accountName: "Accomodation Expense (Local)",
        },
        {
          accountNumber: "512008",
          accountName: "Project Supplies Expense",
        },
        {
          accountNumber: "123200",
          accountName: "Asset Project",
        },
        {
          accountNumber: "512013",
          accountName: "FGD Reguler (perorangan)",
        },
        {
          accountNumber: "512013",
          accountName: "FGD Small Group (per hari)",
        },
        {
          accountNumber: "512003",
          accountName: "Transportasi FGD",
        },
        {
          accountNumber: "512001",
          accountName: "Botanis",
        },
        {
          accountNumber: "512001",
          accountName: "Ornitologist",
        },
        {
          accountNumber: "512001",
          accountName: "Mammalogist",
        },
        {
          accountNumber: "512001",
          accountName: "Herpetologist",
        },
        {
          accountNumber: "512014",
          accountName: "Insurance",
        },
        {
          accountNumber: "512009",
          accountName: "Expert",
        },
      ],
    });
    console.log("Seeded accounts");
  } catch (error) {
    console.error("Error seeding accounts:", error);
  }
}
