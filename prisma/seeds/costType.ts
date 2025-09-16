export async function seedCostType(prisma: any) {
  try {
    // Check if any cost types exist
    const existingCostTypesCount = await prisma.costType.count();
    if (existingCostTypesCount === 0) {
      await prisma.costType.deleteMany();
      console.log("Truncated CostType table");
    } else {
      console.log(
        `Found ${existingCostTypesCount} existing cost types. Adding missing cost types only...`
      );
    }

    // First, create parent categories
    const parentCategories = [
      { name: "Kebutuhan HOK" },
      { name: "Transportasi" },
      { name: "DSA" },
      { name: "Akomodasi Kegiatan" },
      { name: "Logistic" },
      { name: "FGD" },
      { name: "Consultant Fees" },
      { name: "Insurance" },
      { name: "Expert" }
    ];

    let createdParentsCount = 0;
    const parentMap = new Map();

    for (const parentData of parentCategories) {
      let existingParent = await prisma.costType.findFirst({
        where: { name: parentData.name, parentId: null },
      });

      if (!existingParent) {
        existingParent = await prisma.costType.create({
          data: parentData,
        });
        console.log(` ✅ Created parent category: ${parentData.name}`);
        createdParentsCount++;
      } else {
        console.log(` ⏭️ Parent category already exists: ${parentData.name}`);
      }
      
      parentMap.set(parentData.name, existingParent.id);
    }

    // Then create children with parent references or update existing ones
    const costTypesToSeed = [
      { name: "HOK (Carbon)", parentName: "Kebutuhan HOK" },
      { name: "HOK (Biodiv)", parentName: "Kebutuhan HOK" },
      { name: "HOK (Suporting)", parentName: "Kebutuhan HOK" },
      { name: "First Aid", parentName: "Kebutuhan HOK" },
      { name: "Meals Expense", parentName: "Kebutuhan HOK" },
      { name: "Transportation Expense (Mobil)", parentName: "Transportasi" },
      { name: "Transportation Expense (Motor)", parentName: "Transportasi" },
      { name: "Transportation Expense (Bus)", parentName: "Transportasi" },
      { name: "Airport Transportation", parentName: "Transportasi" },
      { name: "Flight Expenses (National)", parentName: "Transportasi" },
      { name: "Over Baggage", parentName: "Transportasi" },
      { name: "DSA Expense", parentName: "DSA" },
      { name: "Accomodation Expense (Hotel)", parentName: "Akomodasi Kegiatan" },
      { name: "Accomodation Expense (Local)", parentName: "Akomodasi Kegiatan" },
      { name: "Project Supplies Expense", parentName: "Logistic" },
      { name: "Asset Project", parentName: "Logistic" },
      { name: "FGD Reguler (perorangan)", parentName: "FGD" },
      { name: "FGD Small Group (per hari)", parentName: "FGD" },
      { name: "Transportasi FGD", parentName: "FGD" },
      { name: "Botanis", parentName: "Consultant Fees" },
      { name: "Ornitologist", parentName: "Consultant Fees" },
      { name: "Mammalogist", parentName: "Consultant Fees" },
      { name: "Herpetologist", parentName: "Consultant Fees" },
      { name: "Insurance", parentName: "Insurance" },
      { name: "Expert", parentName: "Expert" },
    ];

    let createdChildrenCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const costTypeData of costTypesToSeed) {
      const existingCostType = await prisma.costType.findFirst({
        where: { name: costTypeData.name },
      });

      if (existingCostType) {
        // Check if it needs parent assignment
        if (!existingCostType.parentId) {
          await prisma.costType.update({
            where: { id: existingCostType.id },
            data: { parentId: parentMap.get(costTypeData.parentName) },
          });
          console.log(` 🔗 Updated parent for: ${costTypeData.name}`);
          updatedCount++;
        } else {
          console.log(` ⏭️ Cost type already exists with parent: ${costTypeData.name}`);
          skippedCount++;
        }
      } else {
        // Create new cost type with parent
        await prisma.costType.create({
          data: {
            name: costTypeData.name,
            parentId: parentMap.get(costTypeData.parentName),
          },
        });
        console.log(` ✅ Created cost type: ${costTypeData.name}`);
        createdChildrenCount++;
      }
    }

    console.log(
      `Seeded cost types: ${createdParentsCount} parents created, ${createdChildrenCount} children created, ${updatedCount} updated with parents, ${skippedCount} skipped`
    );
  } catch (error) {
    console.error("Error seeding cost types:", error);
  }
}