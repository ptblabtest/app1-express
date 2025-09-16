import prisma from "@/lib/prisma";
import { serviceFactory } from "@/utils/serviceFactory";
import { z } from "zod";

export const expenseService = {
  ...serviceFactory("expense", {
    operations: ["create", "update", "findMany", "findUnique", "upsert"],
    schema: z.object({
      regNumber: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      amount: z.number().min(0, "Amount must be positive"),
      date: z.coerce.date(),
      categoryId: z.string().min(1, "Category ID is required"),
      fundId: z.string().optional().nullable(),
      taskId: z.string().optional().nullable(),
      projectId: z.string().optional().nullable(),
    }),
    queryOptions: {
      select: {
        id: true,
        regNumber: true,
        categoryId: true,
        description: true,
        amount: true,
        date: true,
        createdAt: true,
        updatedAt: true,
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
      },
    },
    transformData: (result: any) => {
      result.categoryName = result.category?.name;

      delete result.category;

      return result;
    },
    beforeCreate: async (data: any, user: any) => {
      if (data.fundId) {
        const { taskId, projectId } = await getFundRelatedIds(data.fundId);
        if (taskId) data.taskId = taskId;
        if (projectId) data.projectId = projectId;
      }
      return data;
    },
    beforeUpdate: async (data: any, id: string, user: any) => {
      if (data.fundId) {
        const { taskId, projectId } = await getFundRelatedIds(data.fundId);
        if (taskId) data.taskId = taskId;
        if (projectId) data.projectId = projectId;
      }
      return data;
    },
  }),
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
