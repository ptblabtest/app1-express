import prisma from "@/lib/prisma";
import { serviceFactory } from "@/utils/serviceFactory";
import { z } from "zod";

export const budgetService = {
  ...serviceFactory("budget", {
    operations: ["create", "update", "findMany", "findUnique"],
    schema: z.object({
      regNumber: z.string().optional().nullable(),
      amount: z.number().optional().nullable(),
      remarks: z.string().optional().nullable(),
      approvedDate: z.coerce.date().optional().nullable(),
      assigneeId: z.string().optional().nullable(),
      projectId: z.string().optional().nullable(),
      createdById: z.string().optional().nullable(),
      updatedById: z.string().optional().nullable(),
      items: z.any().optional().nullable(),
      stages: z.any().optional().nullable(),
    }),
    queryOptions: {
      select: {
        id: true,
        regNumber: true,
        amount: true,
        remarks: true,
        approvedDate: true,
        assigneeId: true,
        createdAt: true,
        updatedAt: true,
        assignee: {
          select: {
            username: true,
          },
        },
        createdBy: {
          select: {
            username: true,
          },
        },
        updatedBy: {
          select: {
            username: true,
          },
        },
        items: {
          select: {
            id: true,
            categoryId: true,
            description: true,
            quantity: true,
            timeUnit: true,
            unitPrice: true,
            amount: true,
            createdAt: true,
            updatedAt: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        project: {
          select: {
            id: true,
            regNumber: true,
          },
        },
        stages: {
          select: {
            id: true,
            type: true,
            comment: true,
            createdAt: true,
            createdBy: {
              select: {
                username: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    },
    transformData: (result: any) => {
      result.itemList = result.items.map((item: any) => {
        item.categoryName = item.category?.name;
        delete item.category;
        return item;
      });

      delete result.items;
      return result;
    },
    beforeCreate: async (data: any, user: any, context: any = {}) => {
      if (data.itemList && Array.isArray(data.itemList)) {
        let validItems = data.itemList.filter(
          (item: any) => item.amount && item.amount > 0
        );

        // Calculate parent amounts based on children
        validItems = await calculateParentAmount(validItems);

        data.items = {
          create: validItems.map((item: any) => ({
            categoryId: item.categoryId,
            description: item.description,
            quantity: item.quantity,
            timeUnit: item.timeUnit,
            unitPrice: item.unitPrice,
            amount: item.amount,
          })),
        };

        data.amount = validItems.reduce(
          (sum, item) => sum + Number(item.amount),
          0
        );

        delete data.itemList;
      }
      return data;
    },

    beforeUpdate: async (data: any, id: string, user: any) => {
      if (data.itemList && Array.isArray(data.itemList)) {
        let validItems = data.itemList.filter(
          (item: any) => item.amount && item.amount > 0
        );

        // Calculate parent amounts based on children
        validItems = await calculateParentAmount(validItems);

        data.items = {
          deleteMany: {},
          create: validItems.map((item: any) => ({
            categoryId: item.categoryId,
            description: item.description,
            quantity: item.quantity,
            timeUnit: item.timeUnit,
            unitPrice: item.unitPrice,
            amount: item.amount,
          })),
        };

        data.amount = validItems.reduce(
          (sum, item) => sum + Number(item.amount),
          0
        );

        delete data.itemList;
      }
      return data;
    },
    afterUpdate: async (record: any, user: any) => {
      // Find the Review stage type for budget model
      const reviewStageType = await prisma.stageType.findFirst({
        where: {
          model: "budget",
          value: "Review",
        },
      });

      if (reviewStageType) {
        // Create a new stage entry
        await prisma.stage.create({
          data: {
            budgetId: record.id,
            stageTypeId: reviewStageType.id,
            comment: "Budget updated - pending review",
            createdById: user.id,
          },
        });
      }
    },
  }),
  getForm: async (id?: string) => {
    // Fetch all categories (both parents and children)
    const allCategories = await prisma.costType.findMany({
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        order: true,
        parentId: true,
        children: {
          select: {
            id: true,
            order: true,
          },
          orderBy: { order: "asc" },
        },
      },
    });

    // Separate parents and children
    const parentCategories = allCategories.filter((cat) => !cat.parentId);
    const childCategories = allCategories.filter((cat) => cat.parentId);

    // Create ordered list with parents before their children
    const orderedCategories: any[] = [];

    parentCategories.forEach((parent) => {
      // Add parent
      orderedCategories.push({
        id: parent.id,
        name: parent.name,
        order: parent.order,
        isParent: true,
      });

      // Add its children
      const children = childCategories
        .filter((child) => child.parentId === parent.id)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      children.forEach((child) => {
        orderedCategories.push({
          id: child.id,
          name: child.name,
          order: child.order,
          isParent: false,
        });
      });
    });

    if (!id) {
      // Create mode - return empty structure
      return {
        itemList: orderedCategories.map((category: any) => ({
          categoryId: category.id,
          categoryName: category.name,
          description: "",
          quantity: 0,
          timeUnit: 1,
          unitPrice: 0,
          amount: 0,
          isParent: category.isParent,
        })),
      };
    }

    // Edit mode - fetch existing budget
    const budget = await budgetService.findUnique(id);

    if (!budget) return null;

    // Create a map of existing items
    const existingItemsMap = new Map(
      (budget.itemList || []).map((item: any) => [item.categoryId, item])
    );

    // Merge existing items with all categories
    const mergedItemList = orderedCategories.map((category: any) => {
      const existingItem = existingItemsMap.get(category.id);
      return (
        existingItem || {
          categoryId: category.id,
          categoryName: category.name,
          description: "",
          quantity: 0,
          timeUnit: 1,
          unitPrice: 0,
          amount: 0,
          isParent: category.isParent,
        }
      );
    });

    return {
      ...budget,
      itemList: mergedItemList,
    };
  },
};

// Helper function to calculate parent amounts based on children
const calculateParentAmount = async (items: any[]) => {
  // Get all unique categoryIds from items
  const categoryIds = items.map((item) => item.categoryId).filter(Boolean);

  // Fetch categories with their parent/child relationships
  const categories = await prisma.costType.findMany({
    where: { id: { in: categoryIds } },
    select: {
      id: true,
      parentId: true,
      children: {
        select: { id: true },
      },
    },
  });

  // Create maps for quick lookup
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const childToParentMap = new Map();
  const parentCategories = categories.filter(
    (c) => !c.parentId && c.children.length > 0
  );

  parentCategories.forEach((parent) => {
    parent.children.forEach((child) => {
      childToParentMap.set(child.id, parent.id);
    });
  });

  // Calculate sums for parent categories based on children
  const parentSums = new Map();

  items.forEach((item) => {
    const parentId = childToParentMap.get(item.categoryId);
    if (parentId && item.amount > 0) {
      const currentSum = parentSums.get(parentId) || 0;
      parentSums.set(parentId, currentSum + Number(item.amount));
    }
  });

  // Update parent items with calculated sums if children exist
  return items.map((item) => {
    const category = categoryMap.get(item.categoryId);
    if (category && !category.parentId && parentSums.has(item.categoryId)) {
      // This is a parent with children that have amounts
      return { ...item, amount: parentSums.get(item.categoryId) };
    }
    return item;
  });
};
