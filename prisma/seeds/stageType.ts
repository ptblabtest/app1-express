export async function seedStageType(prisma: any) {
  try {
    // Check if any stage types exist
    const existingStageTypesCount = await prisma.stageType.count();

    if (existingStageTypesCount === 0) {
      // No stage types - truncate for clean state
      await prisma.stageType.deleteMany();
      console.log("Truncated StageType table");
    } else {
      console.log(
        `Found ${existingStageTypesCount} existing stage types. Adding missing stage types only...`
      );
    }

    const stageProcessData = {
      fund: [
        { order: "1", value: "Draft" },
        { order: "2", value: "Review" },
        { order: "3", value: "Approved" },
        { order: "4", value: "Payment Completed" },
        { order: "5", value: "Pending Settlement" },
        { order: "6", value: "Settlement Completed" },
        { order: "0", value: "Rejected" },
      ],
      budget: [
        { order: "1", value: "Draft" },
        { order: "2", value: "Review" },
        { order: "3", value: "Approved" },
      ],
      pipeline: [
        { order: "1", value: "Pipeline Created" },
        { order: "2", value: "WON" },
        { order: "3", value: "LOST" },
      ],
      project: [
        { order: "0", value: "Draft" },
        { order: "1", value: "In Progress" },
        { order: "2", value: "In Progress - Overdue" },
        { order: "3", value: "Done" },
        { order: "4", value: "Done - Overdue" },
      ],
      milestone: [
        { order: "0", value: "Draft" },
        { order: "1", value: "Review" },
        { order: "2", value: "Approved" },
        { order: "3", value: "In Progress" },
        { order: "4", value: "In Progress - Overdue" },
        { order: "5", value: "Done" },
        { order: "6", value: "Done - Overdue" },
        { order: "7", value: "Invoicing" },
        { order: "8", value: "Paid" },
        { order: "0", value: "Cancelled" },
      ],
      task: [
        { order: "0", value: "Draft" },
        { order: "1", value: "In Progress" },
        { order: "2", value: "In Progress - Overdue" },
        { order: "3", value: "Done" },
        { order: "4", value: "Done - Overdue" },
      ],
    };

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    // Process each model
    for (const [model, stages] of Object.entries(stageProcessData)) {
      console.log(`Processing model: ${model}`);

      for (const stage of stages as any[]) {
        // Check using composite unique key (model + value combination)
        const existingStage = await prisma.stageType.findFirst({
          where: {
            model: model,
            value: stage.value,
          },
        });

        if (existingStage) {
          // Update only if order has changed
          if (existingStage.order !== stage.order) {
            await prisma.stageType.update({
              where: {
                id: existingStage.id,
              },
              data: {
                order: stage.order,
              },
            });
            console.log(
              `  🔄 Updated order for: ${model} - ${stage.value} (${existingStage.order} → ${stage.order})`
            );
            updatedCount++;
          } else {
            console.log(
              `  ⏭️  Stage type unchanged: ${model} - ${stage.value}`
            );
            skippedCount++;
          }
        } else {
          await prisma.stageType.create({
            data: {
              model: model,
              order: stage.order,
              value: stage.value,
            },
          });
          console.log(`  ✅ Created stage type: ${model} - ${stage.value}`);
          createdCount++;
        }
      }
    }

    console.log(
      `Seeded stage types: ${createdCount} created, ${updatedCount} updated, ${skippedCount} unchanged`
    );
  } catch (error) {
    console.error("Error seeding stage types:", error);
  }
}

// lead: [
//   { order: "0", value: "Draft" },
//   { order: "1", value: "Interested" },
//   { order: "2", value: "Engaged" },
//   { order: "3", value: "Approved" },
//   { order: "0", value: "No Response" },
//   { order: "0", value: "Not Qualified" },
//   { order: "0", value: "Rejected" },
// ],
// opportunity: [
//   { order: "0", value: "Draft" },
//   { order: "1", value: "Introductory Meeting" },
//   { order: "2", value: "NDA Due Diligence" },
//   { order: "3", value: "Due Diligence" },
//   { order: "4", value: "Approved" },
//   { order: "0", value: "No Response" },
//   { order: "0", value: "Not Qualified" },
//   { order: "0", value: "Rejected" },
// ],
// quote: [
//   { order: "0", value: "Draft" },
//   { order: "1", value: "Preparation" },
//   { order: "2", value: "Quote Released" },
//   { order: "3", value: "Review by Customer" },
//   { order: "4", value: "Approved" },
//   { order: "0", value: "Quote Expired" },
//   { order: "0", value: "Not Qualified" },
//   { order: "0", value: "Rejected" },
// ],
// contract: [
//   { order: "0", value: "Draft" },
//   { order: "1", value: "Preparation" },
//   { order: "2", value: "Submission" },
//   { order: "3", value: "Legal Review" },
//   { order: "4", value: "Signed" },
//   { order: "0", value: "Cancelled" },
// ],
