import prisma from "../../lib/prisma";
import { generateRegNumber } from "../../utils/mutation/regNumberGenerator";

export const extensionService = {
  createRegNumbersForModel: async (modelName: string, userId: string) => {
    // Validate that the model exists in Prisma
    if (!prisma[modelName]) {
      throw new Error(`Model ${modelName} does not exist`);
    }

    // Get all records that don't have regNumber
    const recordsWithoutRegNumber = await prisma[modelName].findMany({
      where: {
        OR: [{ regNumber: null }, { regNumber: "" }],
      },
      select: { id: true },
    });

    // Process results tracking
    const results = {
      created: 0,
      failed: 0,
      errors: [] as any[],
    };

    // Process one by one to ensure unique regNumbers
    for (const record of recordsWithoutRegNumber) {
      try {
        const newRegNumber = await generateRegNumber(modelName);

        await prisma[modelName].update({
          where: { id: record.id },
          data: {
            regNumber: newRegNumber,
            updatedById: userId,
          },
        });

        results.created++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          recordId: record.id,
          error: error.message,
        });
      }
    }

    return results;
  },
  addRevisionForModel: async (modelName: string, userId: string) => {
    // Validate that the model exists in Prisma
    if (!prisma[modelName]) {
      throw new Error(`Model ${modelName} does not exist`);
    }

    // Get all records that don't have revision or have null revision
    const recordsWithoutRevision = await prisma[modelName].findMany({
      where: {
        OR: [{ revision: null }, { revision: 0 }],
      },
      select: { id: true },
    });

    // Process results tracking
    const results = {
      updated: 0,
      failed: 0,
      errors: [] as any[],
    };

    // Process records and set revision to 1
    for (const record of recordsWithoutRevision) {
      try {
        await prisma[modelName].update({
          where: { id: record.id },
          data: {
            revision: 1,
            updatedById: userId,
          },
        });
        results.updated++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          recordId: record.id,
          error: error.message,
        });
      }
    }

    return results;
  },
};
