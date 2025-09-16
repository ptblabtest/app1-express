import prisma from "@/lib/prisma";
import { calculateBudgetComparison } from "@/utils/query/compareBudgetExpense";
import { serviceFactory } from "@/utils/serviceFactory";
import { z } from "zod";

export const fundService = {
  ...serviceFactory("fund", {
    operations: ["create", "update", "findMany", "findUnique"],
    schema: z.object({
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
      createdById: z.string().optional().nullable(),
      updatedById: z.string().optional().nullable(),
      taskId: z.string().optional().nullable(),
      items: z.any().optional().nullable(),
      stages: z.any().optional().nullable(),
    }),
    queryOptions: {
      select: {
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
            createdAt: "desc",
          },
        },
      },
    },
    transformData: async (result: any) => {
      result.expenseAmount =
        result.expenses?.reduce(
          (sum: number, expense: any) => sum + Number(expense.amount || 0),
          0
        ) || 0;

      result.expenseBalanceAmount = result.amount - result.receivedAmount;

      // Existing itemList transformation
      result.itemList = result.items.map((item: any) => {
        item.categoryName = item.category?.name;
        delete item.category;
        return item;
      });

      // Clean up original arrays if you don't want to return them
      delete result.items;
      delete result.expenses;

      return result;
    },
    beforeCreate: async (data: any, user: any, context: any = {}) => {
      if (data.itemList && Array.isArray(data.itemList)) {
        const validItems = data.itemList.filter(
          (item: any) => item.amount && item.amount > 0
        );

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
        delete data.itemList;
      }
      return data;
    },
    beforeUpdate: async (data: any, id: string, user: any) => {
      if (data.itemList && Array.isArray(data.itemList)) {
        const validItems = data.itemList.filter(
          (item: any) => item.amount && item.amount > 0
        );

        data.items = {
          deleteMany: {}, // Delete all existing items first
          create: validItems.map((item: any) => ({
            categoryId: item.categoryId,
            description: item.description,
            quantity: item.quantity,
            timeUnit: item.timeUnit,
            unitPrice: item.unitPrice,
            amount: item.amount,
          })),
        };
        delete data.itemList;
      }
      return data;
    },
  }),
  getForm: async (id?: string, taskId?: string) => {
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

    // If taskId is provided, get budget items from project
    let budgetItemsMap = new Map();
    let additionalData: any = {};

    if (taskId && !id) {
      // Only for create mode
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
                    take: 1, // Get latest budget
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
      // Create mode - return structure with budget values if available
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

    // Edit mode - fetch existing fund
    const fund = await fundService.findUnique(id);

    if (!fund) return null;

    // Create a map of existing items
    const existingItemsMap = new Map(
      (fund.itemList || []).map((item: any) => [item.categoryId, item])
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
      ...fund,
      itemList: mergedItemList,
    };
  },
  getFundComparison: async (fundId: string, showAll: boolean = true) => {
    // Get fund items as budget for this specific fund
    const fundItems = await prisma.fundItem.findMany({
      where: {
        fundId: fundId,
      },
      select: {
        categoryId: true,
        amount: true,
      },
    });

    // Get expenses for this fund
    const expenses = await prisma.expense.findMany({
      where: {
        fundId: fundId,
      },
      select: {
        categoryId: true,
        amount: true,
      },
    });

    // Return the comparison directly
    return await calculateBudgetComparison(fundItems, expenses, showAll);
  },
};

