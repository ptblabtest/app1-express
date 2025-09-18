import prisma from "@/lib/prisma";
import { prepareForView } from "@/utils/query/prepareForView";
import { calculateBudgetComparison } from "@/utils/query/compareBudgetExpense";
import { applyRegNumber } from "@/utils/mutation/regNumberGenerator";
import { z } from "zod";

const fundSchema = z.object({
  regNumber: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  amount: z.number().optional().nullable(),
  remarks: z.string().min(1, "Remarks is required"),
  requestDate: z.coerce.date().optional().nullable(),
  approvedDate: z.coerce.date().optional().nullable(),
  closedDate: z.coerce.date().optional().nullable(),
  expiredDate: z.coerce.date().optional().nullable(),
  voidDate: z.coerce.date().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
  items: z.any().optional().nullable(),
  stages: z.any().optional().nullable(),
});

const FUND_SELECT = {
  id: true,
  regNumber: true,
  type: true,
  amount: true,
  remarks: true,
  requestDate: true,
  approvedDate: true,
  closedDate: true,
  expiredDate: true,
  voidDate: true,
  dueDate: true,
  assigneeId: true,
  taskId: true,
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
  expenses: {
    select: {
      id: true,
      amount: true,
    },
  },
  task: {
    select: {
      id: true,
      title: true,
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

const transformFund = (fund: any) => {
  const prepared = prepareForView(fund);
  
  prepared.expenseAmount = prepared.expenses?.reduce(
    (sum: number, expense: any) => sum + Number(expense.amount || 0),
    0
  ) || 0;

  prepared.expenseBalanceAmount = prepared.amount - prepared.expenseAmount;

  prepared.itemList = prepared.items?.map((item: any) => {
    item.categoryName = item.category?.name;
    delete item.category;
    return item;
  }) || [];

  delete prepared.items;
  delete prepared.expenses;

  return prepared;
};

export const fundService = {
  create: async (data: any, user: any) => {
    let processedData = { ...data };

    if (processedData.itemList && Array.isArray(processedData.itemList)) {
      const validItems = processedData.itemList.filter(
        (item: any) => item.amount && item.amount > 0
      );

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
      delete processedData.itemList;
    }

    const validatedData = await fundSchema.parseAsync(processedData);

    const regNumber = await applyRegNumber("fund", validatedData.regNumber || undefined);

    const fund = await prisma.fund.create({
      data: {
        ...validatedData,
        regNumber: regNumber || validatedData.regNumber,
        createdById: user.id,
      },
      select: FUND_SELECT,
    });

    return transformFund(fund);
  },

  update: async (id: string, data: any, user: any) => {
    const existingFund = await prisma.fund.findUnique({
      where: { id },
    });

    if (!existingFund) {
      throw new Error("Fund not found");
    }

    let processedData = { ...data };

    if (processedData.itemList && Array.isArray(processedData.itemList)) {
      const validItems = processedData.itemList.filter(
        (item: any) => item.amount && item.amount > 0
      );

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
      delete processedData.itemList;
    }

    const validatedData = await fundSchema.partial().parseAsync(processedData);

    const fund = await prisma.fund.update({
      where: { id },
      data: {
        ...validatedData,
        updatedById: user.id,
      },
      select: FUND_SELECT,
    });

    return transformFund(fund);
  },

  findMany: async (queryParams?: any) => {
    const funds = await prisma.fund.findMany({
      ...queryParams,
      select: FUND_SELECT,
    });

    return funds.map(transformFund);
  },

  findUnique: async (id: string) => {
    const fund = await prisma.fund.findUnique({
      where: { id },
      select: FUND_SELECT,
    });

    if (!fund) {
      throw new Error("Fund not found");
    }

    return transformFund(fund);
  },

  getForm: async (id?: string, taskId?: string) => {
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

    let budgetItemsMap = new Map();
    let additionalData: any = {};

    if (taskId && !id) {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: {
          id: true,
          milestone: {
            select: {
              projectId: true,
              project: {
                select: {
                  budgets: {
                    select: {
                      items: {
                        select: {
                          categoryId: true,
                          description: true,
                          quantity: true,
                          timeUnit: true,
                          unitPrice: true,
                          amount: true,
                        },
                      },
                    },
                    orderBy: {
                      revision: "desc",
                    },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      });

      if (task?.milestone?.project?.budgets?.[0]) {
        const latestBudget = task.milestone.project.budgets[0];
        budgetItemsMap = new Map(
          latestBudget.items.map((item) => [item.categoryId, item])
        );
        additionalData.taskId = taskId;
      }
    }

    if (!id) {
      return {
        ...additionalData,
        itemList: orderedCategories.map((category: any) => {
          const budgetItem = budgetItemsMap.get(category.id);
          return {
            categoryId: category.id,
            categoryName: category.name,
            description: budgetItem?.description || "",
            quantity: budgetItem?.quantity || 0,
            timeUnit: budgetItem?.timeUnit || 1,
            unitPrice: budgetItem?.unitPrice || 0,
            amount: budgetItem?.amount || 0,
            isParent: category.isParent,
          };
        }),
      };
    }

    const fund = await fundService.findUnique(id);

    const existingItemsMap = new Map(
      (fund.itemList || []).map((item: any) => [item.categoryId, item])
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
      ...fund,
      itemList: mergedItemList,
    };
  },

  getFundComparison: async (fundId: string, showAll: boolean = true) => {
    const fundItems = await prisma.fundItem.findMany({
      where: {
        fundId: fundId,
      },
      select: {
        categoryId: true,
        amount: true,
      },
    });

    const expenses = await prisma.expense.findMany({
      where: {
        fundId: fundId,
      },
      select: {
        categoryId: true,
        amount: true,
      },
    });

    return await calculateBudgetComparison(fundItems, expenses, showAll);
  },
};