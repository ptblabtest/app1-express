import prisma from "@/lib/prisma";
import { updateMilestoneProgress } from "./MilestoneService";
import { updateProjectProgress } from "./ProjectService";
import { calculateDuration } from "@/utils/query/calculateDuration";
import { calculateBudgetComparison } from "@/utils/query/compareBudgetExpense";
import { serviceFactory } from "@/utils/serviceFactory";
import { z } from "zod";
import { setFieldAndStageForRelation } from "@/utils/mutation/setRelationStage";

export const taskService = {
  ...serviceFactory("task", {
    operations: ["create", "update", "findMany", "findUnique", "upsert"],
    schema: z.object({
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
      createdById: z.string().optional().nullable(),
      updatedById: z.string().optional().nullable(),
      members: z.any().optional().nullable(),
      stages: z.any().optional().nullable(),
    }),
    queryOptions: {
      select: {
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
        createdAt: true,
        updatedAt: true,
        milestoneId: true,
        milestone: {
          select: {
            id: true,
            title: true,
          },
        },
        assigneeId: true,
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
            createdAt: "desc",
          },
        },
      },
    },
    transformData: async (result: any) => {
      if (result.plannedStartDate && result.plannedEndDate) {
        result.plannedDuration = calculateDuration(
          result.plannedStartDate,
          result.plannedEndDate
        );
      }

      if (result.actualStartDate && result.actualEndDate) {
        result.actualDuration = calculateDuration(
          result.actualStartDate,
          result.actualEndDate
        );
      }

      result.milestoneId = result.milestone?.id || null;
      result.milestoneTitle = result.milestone?.title || null;

      delete result.milestone;

      return result;
    },
    beforeUpdate: async (data: any, id: string, user: any) => {
      if (data.progress !== undefined && data.progress > 100) {
        throw new Error("Progress cannot exceed 100%");
      }

      return data;
    },
    afterCreate: async (record: any, user: any) => {
      await updateProgressAndStages(record, record.createdById);
    },
    afterUpdate: async (record: any, user: any) => {
      await updateProgressAndStages(record, record.updatedById);
    },
  }),
  getFundComparison: async (taskId: string, showAll: boolean = true) => {
    // Get fund items as budget for task
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

    // Get expenses for this task
    const expenses = await prisma.expense.findMany({
      where: {
        taskId: taskId,
      },
      select: {
        categoryId: true,
        amount: true,
      },
    });

    // Return the comparison directly
    return await calculateBudgetComparison(fundItems, expenses, showAll);
  },
  getUtilizationData: async (filters?: {
    dateRange?: { start: Date; end: Date };
    userId?: string;
  }) => {
    const where: any = {};

    // Add user filter if provided
    if (filters?.userId) {
      where.OR = [
        { assigneeId: filters.userId },
        { members: { some: { id: filters.userId } } },
      ];
    }

    // Add date filter if provided
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
          // Include tasks that span across the date range
          {
            AND: [
              { plannedStartDate: { lte: filters.dateRange.end } },
              { plannedEndDate: { gte: filters.dateRange.start } },
            ],
          },
        ],
      };

      // Combine with existing conditions
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

    // Transform data to group by users
    const userMap = new Map();

    tasks.forEach((task: any) => {
      // Process assignee
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

      // Process members
      task.members?.forEach((member: any) => {
        if (!userMap.has(member.id)) {
          userMap.set(member.id, {
            id: member.id,
            name: member.username,
            email: member.email,
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

    // Sort tasks by date for each user
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

  // Update task progress based on actualEndDate
  const taskProgress = taskRecord.actualEndDate ? 100 : 0;
  await prisma.task.update({
    where: { id: record.id },
    data: { progress: taskProgress },
  });

  // Handle actualStartDate propagation
  if (taskRecord.actualStartDate && !taskRecord.milestone.actualStartDate) {
    await setFieldAndStageForRelation(
      milestoneId,
      "milestone",
      userId,
      "actualStartDate",
      "In Progress"
    );

    // Check if project needs actualStartDate
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

  // Update milestone progress and dates
  await updateMilestoneProgress(milestoneId, userId);

  // Update project progress and dates
  await updateProjectProgress(projectId, userId);
};
