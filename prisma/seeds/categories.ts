export async function seedCategories(prisma: any) {
  try {
    // Check if any categories exist
    const existingCategoriesCount = await prisma.category.count();

    if (existingCategoriesCount === 0) {
      // No categories - truncate for clean state
      await prisma.category.deleteMany();
      console.log("Truncated Category table");
    } else {
      console.log(
        `Found ${existingCategoriesCount} existing categories. Adding missing categories only...`
      );
    }

    const categories = [
      {
        key: "legal",
        values: [
          { value: "PT", label: "PT" },
          { value: "CV", label: "CV" },
          { value: "Koperasi", label: "Koperasi" },
          { value: "Yayasan", label: "Yayasan" },
          { value: "Perkumpulan", label: "Perkumpulan" },
        ],
      },
      {
        key: "companyCategory",
        values: [
          { value: "Corporate", label: "Corporate" },
          { value: "NGO", label: "NGO" },
          { value: "Government", label: "Government" },
          { value: "BUMN", label: "BUMN" },
          { value: "BUMD", label: "BUMD" },
        ],
      },
      {
        key: "events",
        values: [
          { value: "Meeting", label: "Meeting" },
          { value: "Training", label: "Training" },
        ],
      },
      {
        key: "leadSource",
        values: [
          { value: "Cold Call", label: "Cold Call" },
          { value: "Existing Customer", label: "Existing Customer" },
          { value: "Self Generated", label: "Self Generated" },
          { value: "Employee", label: "Employee" },
          { value: "Partner", label: "Partner" },
          { value: "Public Relations", label: "Public Relations" },
          { value: "Direct Mail", label: "Direct Mail" },
          { value: "Conference", label: "Conference" },
          { value: "Trade Show", label: "Trade Show" },
          { value: "Web Site", label: "Web Site" },
          { value: "Customer Portal", label: "Customer Portal" },
          { value: "Word of mouth", label: "Word of mouth" },
          { value: "Email", label: "Email" },
          { value: "Other", label: "Other" },
          { value: "Subscription", label: "Subscription" },
        ],
      },
      {
        key: "currency",
        values: [
          { value: "IDR", label: "IDR" },
          { value: "USD", label: "USD" },
          { value: "EUR", label: "EUR" },
          { value: "GBP", label: "GBP" },
          { value: "CAD", label: "CAD" },
          { value: "AUD", label: "AUD" },
          { value: "JPY", label: "JPY" },
          { value: "KRW", label: "KRW" },
          { value: "MYR", label: "MYR" },
          { value: "SGD", label: "SGD" },
          { value: "THB", label: "THB" },
        ],
      },
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const category of categories) {
      for (const item of category.values) {
        // Check using composite unique key (key + value combination)
        const existingCategory = await prisma.category.findFirst({
          where: {
            key: category.key,
            value: item.value,
          },
        });

        if (existingCategory) {
          console.log(
            `  ⏭️  Category already exists: ${category.key} - ${item.value}`
          );
          skippedCount++;
        } else {
          await prisma.category.create({
            data: {
              key: category.key,
              value: item.value,
              label: item.label,
            },
          });
          console.log(`  ✅ Created category: ${category.key} - ${item.value}`);
          createdCount++;
        }
      }
    }

    console.log(
      `Seeded categories: ${createdCount} created, ${skippedCount} skipped`
    );
  } catch (error) {
    console.error("Error seeding categories:", error);
  }
};
