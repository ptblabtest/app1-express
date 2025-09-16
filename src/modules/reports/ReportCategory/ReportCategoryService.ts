import prisma from "@/lib/prisma";
import { prepareForView } from "@/utils/query/prepareForView";
import { z } from "zod";

const reportCategorySchema = z.object({
  name: z.string(),
  order: z.coerce.number().min(0).optional(),
  interval: z.string().optional(),
  parentId: z.string().optional(),
});

const CATEGORY_SELECT = {
  id: true,
  order: true,
  name: true,
  interval: true,
  parentId: true,
  parent: {
    select: {
      id: true,
      name: true,
      interval: true,
    },
  },
  createdAt: true,
  updatedAt: true,
};

export const reportCategoryService = {
  create: async (data: any, user: any) => {
    const validatedData = await reportCategorySchema.parseAsync(data);

    if (validatedData.parentId) {
      const parentLevel = await getCategoryLevel(validatedData.parentId);
      if (parentLevel >= 3) {
        throw new Error("Maximum 3 levels allowed");
      }
    }

    // Get the max order for siblings
    const maxOrder = await prisma.reportCategory.aggregate({
      where: { parentId: validatedData.parentId || null },
      _max: { order: true },
    });

    const processedData = {
      ...validatedData,
      order: validatedData.order ?? (maxOrder._max.order || 0) + 1,
    };

    const category = await prisma.reportCategory.create({
      data: processedData,
    });

    // Reorder siblings if specific order was provided
    if (validatedData.order !== undefined) {
      await reorderSiblings(
        validatedData.parentId || null,
        category.id,
        validatedData.order
      );
    }

    // Create permissions only for level 3 categories
    const level = await getCategoryLevel(category.id);
    if (level === 3) {
      await createCategoryPermissions(category.id, category.name);
    }

    return category;
  },

  update: async (id: string, data: any, user: any) => {
    const validatedData = await reportCategorySchema.partial().parseAsync(data);

    if (validatedData.parentId) {
      const parentLevel = await getCategoryLevel(validatedData.parentId);
      if (parentLevel >= 3) {
        throw new Error("Maximum 3 levels allowed");
      }
    }

    // Get current category to check if parent or order changed
    const currentCategory = await prisma.reportCategory.findUnique({
      where: { id },
      select: { parentId: true, order: true },
    });

    const processedData = {
      ...validatedData,
    };

    const category = await prisma.reportCategory.update({
      where: { id },
      data: processedData,
    });

    // Reorder if order or parent changed
    if (
      validatedData.order !== undefined &&
      (validatedData.order !== currentCategory?.order ||
        validatedData.parentId !== currentCategory?.parentId)
    ) {
      await reorderSiblings(
        category.parentId || null,
        category.id,
        validatedData.order
      );
    }

    return category;
  },

  delete: async (id: string) => {
    // Check if there are any reports using this category
    const reportCount = await prisma.report.count({
      where: { categoryId: id },
    });

    if (reportCount > 0) {
      throw new Error(
        `Cannot delete category. There are ${reportCount} reports using this category.`
      );
    }

    // Check if there are child categories
    const childCount = await prisma.reportCategory.count({
      where: { parentId: id },
    });

    if (childCount > 0) {
      throw new Error(
        `Cannot delete category. There are ${childCount} child categories.`
      );
    }

    // Get category details before deletion
    const categoryToDelete = await prisma.reportCategory.findUnique({
      where: { id },
      select: { parentId: true, order: true },
    });

    // Delete permissions if this is a level 3 category
    await prisma.permission.deleteMany({
      where: {
        resource: `report:category:${id}`,
      },
    });

    const category = await prisma.reportCategory.delete({
      where: { id },
    });

    // Reorder siblings after deletion
    if (categoryToDelete) {
      await reorderAfterDelete(
        categoryToDelete.parentId || null,
        categoryToDelete.order
      );
    }

    return category;
  },
  findMany: async (queryParams?: any, user?: any) => {
    let whereClause: any = queryParams?.where || {};

    // Check user role and apply permission filtering
    if (user?.role?.level >= 3) {
      // Get user's permitted category IDs (level 3 only)
      const userPermissions = await prisma.userPermission.findMany({
        where: { userId: user.id },
        include: {
          permission: {
            where: {
              resource: { startsWith: "report:category:" },
              action: "view",
            },
          },
        },
      });

      const permittedCategoryIds = userPermissions
        .map((up: any) =>
          up.permission?.resource?.replace("report:category:", "")
        )
        .filter(Boolean);

      // Get all parent categories of permitted categories
      const allCategoryIds = new Set(permittedCategoryIds);

      for (const categoryId of permittedCategoryIds) {
        const category = await prisma.reportCategory.findUnique({
          where: { id: categoryId },
          select: {
            parentId: true,
            parent: {
              select: { parentId: true },
            },
          },
        });

        if (category?.parentId) {
          allCategoryIds.add(category.parentId);
          if (category.parent?.parentId) {
            allCategoryIds.add(category.parent.parentId);
          }
        }
      }

      // Add permission filter to where clause
      whereClause = {
        ...whereClause,
        id: { in: Array.from(allCategoryIds) },
      };
    }

    const categories = await prisma.reportCategory.findMany({
      ...queryParams,
      where: whereClause,
      select: CATEGORY_SELECT,
      orderBy: [
        { parentId: "asc" }, // Group by parent
        { order: "asc" }, // Then by order
        { name: "asc" }, // Fallback to name
      ],
    });

    return categories.map((category: any) => {
      const prepared = prepareForView(category);
      return {
        ...prepared,
        hasParent: !!prepared.parentId,
      };
    });
  },
};

export const getCategoryLevel = async (categoryId: string): Promise<number> => {
  const category = await prisma.reportCategory.findUnique({
    where: { id: categoryId },
    select: {
      parentId: true,
      parent: {
        select: { parentId: true },
      },
    },
  });

  if (!category?.parentId) return 1;
  if (!category.parent?.parentId) return 2;
  return 3;
};

export const createCategoryPermissions = async (
  categoryId: string,
  categoryName: string
) => {
  const actions = ["view", "create", "update", "delete"];
  const permissions = [];

  for (const action of actions) {
    const permission = await prisma.permission.create({
      data: {
        name: `Report ${categoryName} - ${action}`,
        resource: `report:category:${categoryId}`,
        action: action,
        description: `Permission to ${action} reports for category ${categoryName}`,
      },
    });
    permissions.push(permission);
  }

  return permissions;
};

const reorderSiblings = async (
  parentId: string | null,
  currentId: string,
  newOrder: number
) => {
  // Get all siblings excluding current
  const siblings = await prisma.reportCategory.findMany({
    where: {
      parentId: parentId,
      id: { not: currentId },
    },
    orderBy: { order: "asc" },
  });

  // Reorder siblings
  const updates = [];
  let orderCounter = 1;

  for (const sibling of siblings) {
    if (orderCounter === newOrder) {
      orderCounter++; // Skip the spot for current item
    }
    if (sibling.order !== orderCounter) {
      updates.push(
        prisma.reportCategory.update({
          where: { id: sibling.id },
          data: { order: orderCounter },
        })
      );
    }
    orderCounter++;
  }

  if (updates.length > 0) {
    await prisma.$transaction(updates);
  }
};

// Helper function to reorder after deletion
const reorderAfterDelete = async (
  parentId: string | null,
  deletedOrder: number
) => {
  // Decrease order for all siblings that had higher order
  await prisma.reportCategory.updateMany({
    where: {
      parentId: parentId,
      order: { gt: deletedOrder },
    },
    data: {
      order: { decrement: 1 },
    },
  });
};
