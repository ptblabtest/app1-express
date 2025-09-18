import prisma from "@/lib/prisma";
import { prepareForView } from "@/utils/query/prepareForView";
import { updateMilestoneProgress } from "./MilestoneService";
import { updateProjectProgress } from "./ProjectService";
import { calculateDuration } from "@/utils/query/calculateDuration";
import { calculateBudgetComparison } from "@/utils/query/compareBudgetExpense";
import { setFieldAndStageForRelation } from "@/utils/mutation/setRelationStage";
import { z } from "zod";

const taskSchema = z.object({
  order: z.number().optional().nullable(),
  title: z.string().min(1, "Title is required"),
  progress: z.number().optional().nullable(),
  deliverables: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  plannedStartDate: z.coerce.date().optional().nullable(),
  plannedEndDate: z.coerce.date().optional().nullable(),
  actualStartDate: z.coerce.date().optional().nullable(),
  actualEndDate: z.coerce.date().optional().nullable(),
  milestoneId: z.string().min(1, "Milestone ID is required"),
  assigneeId: z.string().optional().nullable(),
  members: z.any().optional().nullable(),
  stages: z.any().optional().nullable(),
});

const TASK_SELECT = {
  id: true,
  order: true,
  title: true,
  progress: true,
  deliverables: true,
  remarks: true,
  plannedStartDate: true,
  plannedEndDate: true,
  actualStartDate: true,
  actualEndDate: true,
  milestoneId: true,
  assigneeId: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
  updatedById: true,
  milestone: {
    select: {
      id: true,
      title: true,
    },
  },
  assignee: {
    select: {
      id: true,
      username: true,
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
  members: {
    select: {
      id: true,
      username: true,
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

const transformTask = (task: any) => {
  const prepared = prepareForView(task);

  if (prepared.plannedStartDate && prepared.plannedEndDate) {
    prepared.plannedDuration = calculateDuration(
      prepared.plannedStartDate,
      prepared.plannedEndDate
    );
  }

  if (prepared.actualStartDate && prepared.actualEndDate) {
    prepared.actualDuration = calculateDuration(
      prepared.actualStartDate,
      prepared.actualEndDate
    );
  }

  prepared.milestoneId = prepared.milestone?.id || null;
  prepared.milestoneTitle = prepared.milestone?.title || null;

  delete prepared.milestone;

  return prepared;
};

const updateProgressAndStages = async (record: any, userId: string) => {
  const taskRecord = await prisma.task.findUnique({
    where: { id: record.id },
    select: {
      milestoneId: true,
      actualEndDate: true,
      actualStartDate: true,
      progress: true,
      milestone: {
        select: {
          projectId: true,
          actualStartDate: true,
        },
      },
    },
  });

  if (!taskRecord || !taskRecord.milestone) {
    throw new Error("Task or milestone not found");
  }

  const milestoneId = taskRecord.milestoneId;
  const projectId = taskRecord.milestone.projectId;

  const taskProgress = taskRecord.actualEndDate ? 100 : 0;
  await prisma.task.update({
    where: { id: record.id },
    data: { progress: taskProgress },
  });

  if (taskRecord.actualStartDate && !taskRecord.milestone.actualStartDate) {
    await setFieldAndStageForRelation(
      milestoneId,
      "milestone",
      userId,
      "actualStartDate",
      "In Progress"
    );

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { actualStartDate: true },
    });

    if (!project?.actualStartDate) {
      await setFieldAndStageForRelation(
        projectId,
        "project",
        userId,
        "actualStartDate",
        "In Progress"
      );
    }
  }

  await updateMilestoneProgress(milestoneId, userId);
  await updateProjectProgress(projectId, userId);
};

export const taskService = {
  create: async (data: any, user: any) => {
    const validatedData = await taskSchema.parseAsync(data);

    const task = await prisma.task.create({
      data: {
        ...validatedData,
        createdById: user.id,
      },
      select: TASK_SELECT,
    });

    await updateProgressAndStages(task, task.createdById);
    return transformTask(task);
  },

  update: async (id: string, data: any, user: any) => {
    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      throw new Error("Task not found");
    }

    if (data.progress !== undefined && data.progress > 100) {
      throw new Error("Progress cannot exceed 100%");
    }

    const validatedData = await taskSchema.partial().parseAsync(data);

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...validatedData,
        updatedById: user.id,
      },
      select: TASK_SELECT,
    });

    await updateProgressAndStages(task, task.updatedById);
    return transformTask(task);
  },

  findMany: async (queryParams?: any) => {
    const tasks = await prisma.task.findMany({
      ...queryParams,
      select: TASK_SELECT,
    });

    return tasks.map(transformTask);
  },

  findUnique: async (id: string) => {
    const task = await prisma.task.findUnique({
      where: { id },
      select: TASK_SELECT,
    });

    if (!task) {
      throw new Error("Task not found");
    }

    return transformTask(task);
  },

  upsert: async (data: any, user: any) => {
    const items = data.data;
    const results = [];

    for (let index = 0; index < items.length; index++) {
      const item = { ...items[index] };
      
      if (item.tempId) {
        delete item.tempId;
      }

      item.order = index + 1;

      let result;
      if (item.id) {
        result = await taskService.update(item.id, item, user);
      } else {
        result = await taskService.create(item, user);
      }

      results.push(result);
    }

    return results;
  },

  getFundComparison: async (taskId: string, showAll: boolean = true) => {
    const fundItems = await prisma.fundItem.findMany({
      where: {
        fund: {
          taskId: taskId,
        },
      },
      select: {
        categoryId: true,
        amount: true,
      },
    });

    const expenses = await prisma.expense.findMany({
      where: {
        taskId: taskId,
      },
      select: {
        categoryId: true,
        amount: true,
      },
    });

    return await calculateBudgetComparison(fundItems, expenses, showAll);
  },

  getUtilizationData: async (filters?: {
    dateRange?: { start: Date; end: Date };
    userId?: string;
  }) => {
    const where: any = {};

    if (filters?.userId) {
      where.OR = [
        { assigneeId: filters.userId },
        { members: { some: { id: filters.userId } } },
      ];
    }

    if (filters?.dateRange) {
      const dateCondition = {
        OR: [
          {
            plannedStartDate: {
              gte: filters.dateRange.start,
              lte: filters.dateRange.end,
            },
          },
          {
            plannedEndDate: {
              gte: filters.dateRange.start,
              lte: filters.dateRange.end,
            },
          },
          {
            AND: [
              { plannedStartDate: { lte: filters.dateRange.end } },
              { plannedEndDate: { gte: filters.dateRange.start } },
            ],
          },
        ],
      };

      if (where.OR) {
        where.AND = [{ OR: where.OR }, dateCondition];
        delete where.OR;
      } else {
        where.OR = dateCondition.OR;
      }
    }

    const tasks = await prisma.task.findMany({
      where,
      select: {
        id: true,
        title: true,
        plannedStartDate: true,
        plannedEndDate: true,
        assignee: {
          select: {
            id: true,
            username: true,
          },
        },
        members: {
          select: {
            id: true,
            username: true,
          },
        },
        milestone: {
          select: {
            title: true,
            project: {
              select: {
                id: true,
                regNumber: true,
                contract: {
                  select: {
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        plannedStartDate: "asc",
      },
    });

    const userMap = new Map();

    tasks.forEach((task: any) => {
      if (task.assignee) {
        if (!userMap.has(task.assignee.id)) {
          userMap.set(task.assignee.id, {
            id: task.assignee.id,
            name: task.assignee.username,
            tasks: [],
          });
        }

        userMap.get(task.assignee.id).tasks.push({
          id: task.id,
          title: task.title,
          role: "assignee",
          plannedStartDate: task.plannedStartDate,
          plannedEndDate: task.plannedEndDate,
          projectName:
            task.milestone?.project?.contract?.title ||
            task.milestone?.project?.regNumber ||
            "Unknown Project",
          milestoneTitle: task.milestone?.title || "Unknown Milestone",
        });
      }

      task.members?.forEach((member: any) => {
        if (!userMap.has(member.id)) {
          userMap.set(member.id, {
            id: member.id,
            name: member.username,
            tasks: [],
          });
        }

        userMap.get(member.id).tasks.push({
          id: task.id,
          title: task.title,
          role: "member",
          plannedStartDate: task.plannedStartDate,
          plannedEndDate: task.plannedEndDate,
          projectName:
            task.milestone?.project?.contract?.title ||
            task.milestone?.project?.regNumber ||
            "Unknown Project",
          milestoneTitle: task.milestone?.title || "Unknown Milestone",
        });
      });
    });

    userMap.forEach((user: any) => {
      user.tasks.sort(
        (a: any, b: any) =>
          new Date(a.plannedStartDate).getTime() -
          new Date(b.plannedStartDate).getTime()
      );
    });

    return {
      users: Array.from(userMap.values()),
      totalTasks: tasks.length,
      filters: filters || null,
    };
  },
};