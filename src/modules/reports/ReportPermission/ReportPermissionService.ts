import prisma from "@/lib/prisma";
import { getCategoryLevel } from "@/modules/reports/ReportCategory/ReportCategoryService";

export const reportPermissionService = {
  bulkReplaceByCategories: async (userId: string, permissions: any) => {
    // Convert permissions object to array format
    const permissionArray: any[] = [];
    const categoryIds = Object.keys(permissions);

    for (const categoryId of categoryIds) {
      const actions = permissions[categoryId];
      for (const action of actions) {
        permissionArray.push({
          categoryId,
          action,
        });
      }
    }

    // Validate all categories are leaf categories
    for (const categoryId of categoryIds) {
      const childCount = await prisma.reportCategory.count({
        where: { parentId: categoryId },
      });

      if (childCount > 0) {
        const category = await prisma.reportCategory.findUnique({
          where: { id: categoryId },
          select: { name: true },
        });
        throw new Error(
          `Category "${category?.name}" has child categories and cannot have permissions assigned`
        );
      }
    }

    // Build permission lookups
    const permissionConditions = permissionArray.map((p: any) => ({
      resource: `report:category:${p.categoryId}`,
      action: p.action,
    }));

    // Find all matching permissions
    const dbPermissions = await prisma.permission.findMany({
      where: {
        OR: permissionConditions,
      },
      select: { id: true },
    });

    if (dbPermissions.length !== permissionConditions.length) {
      throw new Error("Some permissions not found. Run first.");
    }

    // Get count before
    const beforeCount = await prisma.userPermission.count({
      where: { userId },
    });

    // Bulk replace
    await prisma.$transaction(async (tx: any) => {
      await tx.userPermission.deleteMany({
        where: { userId },
      });

      if (dbPermissions.length > 0) {
        await tx.userPermission.createMany({
          data: dbPermissions.map((p: any) => ({
            userId,
            permissionId: p.id,
          })),
        });
      }
    });

    return {
      success: true,
      beforeCount,
      afterCount: dbPermissions.length,
    };
  },
  getUserPermissionMatrix: async (userId: string) => {
    // Get all categories
    const allCategories = await prisma.reportCategory.findMany({
      select: { id: true, name: true, parentId: true },
    });

    // Filter for level 3 categories only
    const level3Categories = [];
    for (const category of allCategories) {
      const level = await getCategoryLevel(category.id);
      if (level === 3) {
        level3Categories.push(category);
      }
    }

    // Get user's current permissions with permission details
    const userPermissions = await prisma.userPermission.findMany({
      where: { userId },
      include: {
        permission: true,
      },
    });

    // Build the matrix
    const matrix: any = {};

    // Initialize all level 3 categories with empty arrays
    for (const category of level3Categories) {
      matrix[category.id] = [];
    }

    // Populate with user's actual permissions
    for (const up of userPermissions) {
      if (
        up.permission &&
        up.permission.resource.startsWith("report:category:")
      ) {
        const categoryId = up.permission.resource.replace(
          "report:category:",
          ""
        );
        const action = up.permission.action;

        if (matrix[categoryId]) {
          matrix[categoryId].push(action);
        }
      }
    }

    return {
      categories: level3Categories,
      permissions: matrix,
    };
  },
};
