import prisma from "@/lib/prisma";
import { prepareForView } from "@/utils/query/prepareForView";
import { applyRegNumber } from "@/utils/mutation/regNumberGenerator";
import { z } from "zod";

const expenseSchema = z.object({
  regNumber: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  amount: z.number().min(0, "Amount must be positive"),
  date: z.coerce.date(),
  categoryId: z.string().min(1, "Category ID is required"),
  fundId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
});

const EXPENSE_SELECT = {
  id: true,
  regNumber: true,
  categoryId: true,
  description: true,
  amount: true,
  date: true,
  fundId: true,
  taskId: true,
  projectId: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
  updatedById: true,
  category: {
    select: {
      id: true,
      name: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      username: true,
    },
  },
  updatedBy: {
    select: {
      id: true,
      username: true,
    },
  },
};

const transformExpense = (expense: any) => {
  const prepared = prepareForView(expense);
  
  prepared.categoryName = prepared.category?.name || null;
  delete prepared.category;

  return prepared;
};

const getFundRelatedIds = async (fundId: string) => {
  const fund = await prisma.fund.findUnique({
    where: { id: fundId },
    select: {
      taskId: true,
      task: {
        select: {
          milestoneId: true,
          milestone: {
            select: {
              projectId: true,
            },
          },
        },
      },
    },
  });

  return {
    taskId: fund?.taskId || undefined,
    projectId: fund?.task?.milestone?.projectId || undefined,
  };
};

export const expenseService = {
  create: async (data: any, user: any) => {
    let processedData = { ...data };

    if (processedData.fundId) {
      const { taskId, projectId } = await getFundRelatedIds(processedData.fundId);
      if (taskId) processedData.taskId = taskId;
      if (projectId) processedData.projectId = projectId;
    }

    const validatedData = await expenseSchema.parseAsync(processedData);

    const regNumber = await applyRegNumber("expense", validatedData.regNumber || undefined);

    const expense = await prisma.expense.create({
      data: {
        ...validatedData,
        regNumber: regNumber || validatedData.regNumber,
        createdById: user.id,
      },
      select: EXPENSE_SELECT,
    });

    return transformExpense(expense);
  },

  update: async (id: string, data: any, user: any) => {
    const existingExpense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!existingExpense) {
      throw new Error("Expense not found");
    }

    let processedData = { ...data };

    if (processedData.fundId) {
      const { taskId, projectId } = await getFundRelatedIds(processedData.fundId);
      if (taskId) processedData.taskId = taskId;
      if (projectId) processedData.projectId = projectId;
    }

    const validatedData = await expenseSchema.partial().parseAsync(processedData);

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        ...validatedData,
        updatedById: user.id,
      },
      select: EXPENSE_SELECT,
    });

    return transformExpense(expense);
  },

  findMany: async (queryParams?: any) => {
    const expenses = await prisma.expense.findMany({
      ...queryParams,
      select: EXPENSE_SELECT,
    });

    return expenses.map(transformExpense);
  },

  findUnique: async (id: string) => {
    const expense = await prisma.expense.findUnique({
      where: { id },
      select: EXPENSE_SELECT,
    });

    if (!expense) {
      throw new Error("Expense not found");
    }

    return transformExpense(expense);
  },

  upsert: async (data: any, user: any) => {
    const items = data.data;
    const results = [];

    for (let index = 0; index < items.length; index++) {
      const item = { ...items[index] };
      
      if (item.tempId) {
        delete item.tempId;
      }

      let result;
      if (item.id) {
        result = await expenseService.update(item.id, item, user);
      } else {
        result = await expenseService.create(item, user);
      }

      results.push(result);
    }

    return results;
  },

  fixMissingRelatedIds: async () => {
    const expensesWithFund = await prisma.expense.findMany({
      where: {
        fundId: { not: null },
        OR: [{ taskId: null }, { projectId: null }],
      },
      select: {
        id: true,
        fundId: true,
      },
    });

    for (const expense of expensesWithFund) {
      const { taskId, projectId } = await getFundRelatedIds(expense.fundId);

      await prisma.expense.update({
        where: { id: expense.id },
        data: {
          taskId: taskId || undefined,
          projectId: projectId || undefined,
        },
      });
    }
  },
};