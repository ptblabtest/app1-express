export async function seedProducts(prisma: any) {
  try {
    // Check if any products exist
    const existingProductsCount = await prisma.product.count();

    if (existingProductsCount === 0) {
      // No products - truncate for clean state
      await prisma.product.deleteMany();
      console.log("Truncated Product table");
    } else {
      console.log(
        `Found ${existingProductsCount} existing products. Adding missing products only...`
      );
    }

    const productsToSeed = [
      { name: "SBIA" },
      { name: "Biodiversity Offset" },
      { name: "FPIC" },
      { name: "Training and Assistance" },
      { name: "Climate Action" },
      { name: "Assessment HCV-HCS" },
      { name: "RSPO RaCP" },
      { name: "Climate" },
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const productData of productsToSeed) {
      const existingProduct = await prisma.product.findFirst({
        where: { name: productData.name },
      });

      if (existingProduct) {
        console.log(` ⏭️ Product already exists: ${productData.name}`);
        skippedCount++;
      } else {
        await prisma.product.create({
          data: productData,
        });
        console.log(` ✅ Created product: ${productData.name}`);
        createdCount++;
      }
    }

    console.log(
      `Seeded products: ${createdCount} created, ${skippedCount} skipped`
    );
  } catch (error) {
    console.error("Error seeding products:", error);
  }
}
