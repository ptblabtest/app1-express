import prisma from "@/lib/prisma";
import { prepareForView } from "@/utils/query/prepareForView";
import { applyRegNumber } from "@/utils/mutation/regNumberGenerator";
import { z } from "zod";

const budgetSchema = z.object({
  regNumber: z.string().optional().nullable(),
  amount: z.number().optional().nullable(),
  remarks: z.string().optional().nullable(),
  approvedDate: z.coerce.date().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  items: z.any().optional().nullable(),
  stages: z.any().optional().nullable(),
});

const BUDGET_SELECT = {
  id: true,
  regNumber: true,
  amount: true,
  remarks: true,
  approvedDate: true,
  assigneeId: true,
  projectId: true,
  revision: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
  updatedById: true,
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
      createdAt: "desc" as const,
    },
  },
};

const calculateParentAmount = async (items: any[]) => {
  const categoryIds = items.map((item) => item.categoryId).filter(Boolean);

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

  const parentSums = new Map();

  items.forEach((item) => {
    const parentId = childToParentMap.get(item.categoryId);
    if (parentId && item.amount > 0) {
      const currentSum = parentSums.get(parentId) || 0;
      parentSums.set(parentId, currentSum + Number(item.amount));
    }
  });

  return items.map((item) => {
    const category = categoryMap.get(item.categoryId);
    if (category && !category.parentId && parentSums.has(item.categoryId)) {
      return { ...item, amount: parentSums.get(item.categoryId) };
    }
    return item;
  });
};

const transformBudget = (budget: any) => {
  const prepared = prepareForView(budget);
  
  prepared.itemList = prepared.items?.map((item: any) => {
    item.categoryName = item.category?.name;
    delete item.category;
    return item;
  }) || [];

  delete prepared.items;
  return prepared;
};

export const budgetService = {
  create: async (data: any, user: any) => {
    let processedData = { ...data };

    if (processedData.itemList && Array.isArray(processedData.itemList)) {
      let validItems = processedData.itemList.filter(
        (item: any) => item.amount && item.amount > 0
      );

      validItems = await calculateParentAmount(validItems);

      processedData.items = {
        create: validItems.map((item: any) => ({
          categoryId: item.categoryId,
          description: item.description,
          quantity: item.quantity,
          timeUnit: item.timeUnit,
          unitPrice: item.unitPrice,
          amount: item.amount,
        })),
      };

      processedData.amount = validItems.reduce(
        (sum, item) => sum + Number(item.amount),
        0
      );

      delete processedData.itemList;
    }

    const validatedData = await budgetSchema.parseAsync(processedData);

    const regNumber = await applyRegNumber("budget", validatedData.regNumber || undefined);

    const budget = await prisma.budget.create({
      data: {
        ...validatedData,
        regNumber: regNumber || validatedData.regNumber,
        createdById: user.id,
      },
      select: BUDGET_SELECT,
    });

    return transformBudget(budget);
  },

  update: async (id: string, data: any, user: any) => {
    const existingBudget = await prisma.budget.findUnique({
      where: { id },
    });

    if (!existingBudget) {
      throw new Error("Budget not found");
    }

    let processedData = { ...data };

    if (processedData.itemList && Array.isArray(processedData.itemList)) {
      let validItems = processedData.itemList.filter(
        (item: any) => item.amount && item.amount > 0
      );

      validItems = await calculateParentAmount(validItems);

      processedData.items = {
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

      processedData.amount = validItems.reduce(
        (sum, item) => sum + Number(item.amount),
        0
      );

      delete processedData.itemList;
    }

    const validatedData = await budgetSchema.partial().parseAsync(processedData);

    const budget = await prisma.budget.update({
      where: { id },
      data: {
        ...validatedData,
        updatedById: user.id,
      },
      select: BUDGET_SELECT,
    });

    // Create review stage after update
    const reviewStageType = await prisma.stageType.findFirst({
      where: {
        model: "budget",
        value: "Review",
      },
    });

    if (reviewStageType) {
      await prisma.stage.create({
        data: {
          budgetId: budget.id,
          stageTypeId: reviewStageType.id,
          comment: "Budget updated - pending review",
          createdById: user.id,
        },
      });
    }

    return transformBudget(budget);
  },

  findMany: async (queryParams?: any) => {
    const budgets = await prisma.budget.findMany({
      ...queryParams,
      select: BUDGET_SELECT,
    });

    return budgets.map(transformBudget);
  },

  findUnique: async (id: string) => {
    const budget = await prisma.budget.findUnique({
      where: { id },
      select: BUDGET_SELECT,
    });

    if (!budget) {
      throw new Error("Budget not found");
    }

    return transformBudget(budget);
  },

  getForm: async (id?: string) => {
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

    const parentCategories = allCategories.filter((cat) => !cat.parentId);
    const childCategories = allCategories.filter((cat) => cat.parentId);

    const orderedCategories: any[] = [];

    parentCategories.forEach((parent) => {
      orderedCategories.push({
        id: parent.id,
        name: parent.name,
        order: parent.order,
        isParent: true,
      });

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

    const budget = await budgetService.findUnique(id);

    const existingItemsMap = new Map(
      (budget.itemList || []).map((item: any) => [item.categoryId, item])
    );

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