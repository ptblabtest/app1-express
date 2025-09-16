export async function seedOrganizations(prisma: any) {
  try {
    const existingOrgsCount = await prisma.organization.count();
    if (existingOrgsCount === 0) {
      await prisma.organization.deleteMany();
      console.log("Truncated Organization table");
    } else {
      console.log(
        `Found ${existingOrgsCount} existing organizations. Adding missing organizations only...`
      );
    }

    const organizationsToSeed = [
      { name: "Organization 1", code: "ORG1" },
      { name: "Organization 2", code: "ORG2" },
      { name: "Organization 3", code: "ORG3" },
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const orgData of organizationsToSeed) {
      const existingOrg = await prisma.organization.findFirst({
        where: {
          OR: [{ name: orgData.name }, { code: orgData.code }],
        },
      });

      if (existingOrg) {
        console.log(` ⏭️ Organization already exists: ${orgData.name}`);
        skippedCount++;
      } else {
        await prisma.organization.create({
          data: orgData,
        });
        console.log(` ✅ Created organization: ${orgData.name}`);
        createdCount++;
      }
    }

    console.log(
      `Seeded organizations: ${createdCount} created, ${skippedCount} skipped`
    );
  } catch (error) {
    console.error("Error seeding organizations:", error);
  }
}
