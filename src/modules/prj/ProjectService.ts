import { milestoneService } from "@/modules/prj/MilestoneService";
import prisma from "@/lib/prisma";
import { setFieldAndStageForRelation } from "@/utils/mutation/setRelationStage";
import { calculateDuration } from "@/utils/query/calculateDuration";
import { calculateProjectProgress } from "@/utils/query/calculateProgress";
import { calculateBudgetComparison } from "@/utils/query/compareBudgetExpense";
import { serviceFactory } from "@/utils/serviceFactory";
import { z } from "zod";

export const projectService = {
  ...serviceFactory("project", {
    operations: ["create", "update", "findMany", "findUnique"],
    schema: z.object({
      regNumber: z.string().optional().nullable(),
      progress: z.coerce.number().optional().nullable(),
      plannedStartDate: z.coerce.date().optional().nullable(),
      plannedEndDate: z.coerce.date().optional().nullable(),
      actualStartDate: z.coerce.date().optional().nullable(),
      actualEndDate: z.coerce.date().optional().nullable(),
      contractId: z.string().optional().nullable(),
      assigneeId: z.string().optional().nullable(),
      members: z.any().optional().nullable(),
      stages: z.any().optional().nullable(),
      milestones: z.any().optional().nullable(),
      createdById: z.string().optional().nullable(),
      updatedById: z.string().optional().nullable(),
    }),
    queryOptions: {
      select: {
        id: true,
        regNumber: true,
        progress: true,
        plannedStartDate: true,
        plannedEndDate: true,
        actualStartDate: true,
        actualEndDate: true,
        contractId: true,
        assigneeId: true,
        createdAt: true,
        updatedAt: true,
        contract: {
          select: {
            regNumber: true,
            title: true,
            clientPicName: true,
            amount: true,
            client: {
              select: {
                id: true,
                name: true,
              },
            },
            products: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
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
        milestones: {
          select: {
            order: true,
            title: true,
            progress: true,
            deliverables: true,
            remarks: true,
            share: true,
            amount: true,
            plannedStartDate: true,
            plannedEndDate: true,
            actualStartDate: true,
            actualEndDate: true,
            createdAt: true,
            updatedAt: true,
            tasks: true,
          },
          orderBy: {
            order: "asc",
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

      result.contractTitle = result.contract?.title || null;
      result.contractNumber = result.contract?.regNumber || null;
      result.contractAmount = result.contract?.amount || null;
      result.clientName = result.contract?.client?.name || null;
      result.productName = result.contract?.product?.name || null;
      result.clientPicName = result.contract?.clientPicName || null;

      delete result.contract;

      if (result.milestones) {
        result.milestoneList = result.milestones;
        delete result.milestones;
      }

      return result;
    },
    beforeCreate: async (data: any, user: any) => {
      // Map milestoneList to milestones before validation
      if (data.milestoneList && Array.isArray(data.milestoneList)) {
        data.milestones = {
          create: data.milestoneList.map((milestone: any, index: number) => ({
            ...milestone,
            order: milestone.order ?? index + 1,
            createdById: user.id,
            updatedById: user.id,
          })),
        };
        delete data.milestoneList;
      }
      return data;
    },
    beforeUpdate: async (data: any, id: string, user: any) => {
      // Handle milestone upsert separately
      if (data.milestoneList && Array.isArray(data.milestoneList)) {
        // Add projectId to each milestone and strip tasks
        const milestonesWithProjectId = data.milestoneList.map(
          (milestone: any) => {
            const { tasks, ...milestoneWithoutTasks } = milestone;
            return {
              ...milestoneWithoutTasks,
              projectId: id,
            };
          }
        );

        // Use milestoneService.upsert to handle create/update
        await milestoneService.upsert({ data: milestonesWithProjectId }, user);

        // Remove milestoneList from data since we handled it separately
        delete data.milestoneList;
      }
      return data;
    },
  }),
  getBudgetComparison: async (projectId: string, showAll: boolean = true) => {
    // Get all budget items for this project
    const budgetItems = await prisma.budgetItem.findMany({
      where: {
        budget: {
          projectId: projectId,
        },
      },
      select: {
        categoryId: true,
        amount: true,
      },
    });

    // Get all expenses for this project (will include task expenses via correlation)
    const expenses = await prisma.expense.findMany({
      where: {
        projectId: projectId,
      },
      select: {
        categoryId: true,
        amount: true,
      },
    });

    // Return the comparison directly
    return await calculateBudgetComparison(budgetItems, expenses, showAll);
  },
  getGanttData: async (projectId: string) => {
    return await projectGanttChart(projectId);
  },
  getScurveData: async (
    projectId: string,
    intervalType?: "daily" | "weekly" | "monthly" | "quarterly"
  ) => {
    return await projectScurve(projectId, intervalType);
  },
};

export const updateProjectProgress = async (
  projectId: string,
  userId: string
) => {
  // Query project with its milestones
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      actualEndDate: true,
      milestones: {
        select: {
          actualEndDate: true,
        },
      },
    },
  });

  if (!project) return;

  // Use existing calculateProjectProgress function
  const projectProgress = await calculateProjectProgress(projectId);

  // Check if ALL milestones complete
  const allMilestonesComplete =
    project.milestones.length > 0 &&
    project.milestones.every((m: any) => m.actualEndDate !== null);

  // Handle actualEndDate and stages
  if (allMilestonesComplete) {
    await setFieldAndStageForRelation(
      projectId,
      "project",
      userId,
      "actualEndDate",
      "Done"
    );
  } else {
    // Clear actualEndDate if exists
    if (project.actualEndDate) {
      await prisma.project.update({
        where: { id: projectId },
        data: { actualEndDate: null },
      });
    }

    // Use setFieldAndStageForRelation for In Progress (it handles duplication)
    if (projectProgress > 0 && projectProgress < 100) {
      await setFieldAndStageForRelation(
        projectId,
        "project",
        userId,
        "actualStartDate", // We set actualStartDate, not a different field
        "In Progress"
      );
    }
  }

  // Update progress
  await prisma.project.update({
    where: { id: projectId },
    data: { progress: projectProgress },
  });
};

// s-curve
const projectScurve = async (
  projectId: string,
  intervalType?: "daily" | "weekly" | "monthly" | "quarterly"
) => {
  const projectData = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      regNumber: true,
      plannedStartDate: true,
      plannedEndDate: true,
      budgets: {
        select: {
          items: {
            select: {
              amount: true,
            },
          },
        },
      },
      expenses: {
        select: {
          amount: true,
          date: true,
        },
        orderBy: {
          date: "asc",
        },
      },
    },
  });

  if (!projectData) {
    throw new Error(`Project ${projectId} not found`);
  }

  const startDate = projectData.plannedStartDate;
  const endDate = projectData.plannedEndDate;

  if (!startDate || !endDate) {
    throw new Error(
      "Project must have planned start and end dates for S-curve"
    );
  }

  // Calculate total budget from budget items
  let totalBudget = 0;
  projectData.budgets.forEach((budget: any) => {
    budget.items.forEach((item: any) => {
      totalBudget += Number(item.amount || 0);
    });
  });

  const { intervals, type } = generateIntervals(
    startDate,
    endDate,
    intervalType
  );

  // Calculate planned budget (evenly distributed)
  const plannedPerInterval = totalBudget / intervals.length;

  // Calculate cumulative values
  let cumulativePlanned = 0;
  let cumulativeActual = 0;

  const scurveData = intervals.map((interval: any) => {
    cumulativePlanned += plannedPerInterval;

    // Get expenses in this interval
    const intervalExpenses = projectData.expenses.filter((expense: any) => {
      if (!expense.date) return false;
      const expenseDate = new Date(expense.date);
      return expenseDate >= interval.start && expenseDate <= interval.end;
    });

    const intervalActual = intervalExpenses.reduce(
      (sum: number, exp: any) => sum + Number(exp.amount || 0),
      0
    );
    cumulativeActual += intervalActual;

    return {
      period: interval.label,
      date: interval.end,
      plannedValue: Math.round(cumulativePlanned * 100) / 100,
      actualCost: Math.round(cumulativeActual * 100) / 100,
      variance: Math.round((cumulativePlanned - cumulativeActual) * 100) / 100,
    };
  });

  return {
    project: {
      id: projectData.id,
      regNumber: projectData.regNumber,
      startDate,
      endDate,
      intervalType: type, // Include selected type for frontend reference
    },
    summary: {
      totalBudget: Math.round(totalBudget * 100) / 100,
      totalExpenses: Math.round(cumulativeActual * 100) / 100,
      remaining: Math.round((totalBudget - cumulativeActual) * 100) / 100,
      percentSpent:
        totalBudget > 0
          ? Math.round((cumulativeActual / totalBudget) * 10000) / 100
          : 0,
    },
    data: scurveData,
  };
};

// Single combined function for all interval logic
const generateIntervals = (startDate: any, endDate: any, type?: string) => {
  const intervals = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  let current = new Date(start);

  // Auto-detect interval type if not provided
  if (!type) {
    const durationInDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (durationInDays <= 30) type = "daily";
    else if (durationInDays <= 90) type = "weekly";
    else if (durationInDays <= 365) type = "monthly";
    else type = "quarterly";
  }

  switch (type) {
    case "daily":
      while (current <= end) {
        intervals.push({
          start: new Date(current),
          end: new Date(current),
          label: current.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
        });
        current.setDate(current.getDate() + 1);
      }
      break;

    case "weekly":
      while (current <= end) {
        const weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const actualEnd = weekEnd > end ? end : weekEnd;

        intervals.push({
          start: new Date(current),
          end: actualEnd,
          label: `W${Math.ceil(current.getDate() / 7)} ${current.toLocaleDateString("en-US", { month: "short" })}`,
        });
        current.setDate(current.getDate() + 7);
      }
      break;

    case "monthly":
      current = new Date(start.getFullYear(), start.getMonth(), 1);
      while (current <= end) {
        const intervalEnd = new Date(
          current.getFullYear(),
          current.getMonth() + 1,
          0
        );

        intervals.push({
          start: new Date(current),
          end: intervalEnd > end ? end : intervalEnd,
          label: `${current.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`,
        });
        current.setMonth(current.getMonth() + 1);
      }
      break;

    case "quarterly":
      current = new Date(
        start.getFullYear(),
        Math.floor(start.getMonth() / 3) * 3,
        1
      );
      while (current <= end) {
        const quarterEnd = new Date(
          current.getFullYear(),
          current.getMonth() + 3,
          0
        );
        const actualEnd = quarterEnd > end ? end : quarterEnd;
        const quarter = Math.floor(current.getMonth() / 3) + 1;

        intervals.push({
          start: new Date(current),
          end: actualEnd,
          label: `Q${quarter} ${current.getFullYear()}`,
        });
        current.setMonth(current.getMonth() + 3);
      }
      break;
  }

  return { intervals, type }; // Return both intervals and the type used
};

// gantt chart
const projectGanttChart = async (projectId?: string) => {
  const projectData = projectId
    ? await prisma.project.findUnique({
        where: { id: projectId },
        select: getGanttSelectQuery(),
      })
    : await prisma.project.findMany({
        select: getGanttSelectQuery(),
      });

  if (projectId && !projectData) {
    throw new Error(`Project ${projectId} not found`);
  }

  // Handle both single project and array of projects
  const projects = Array.isArray(projectData) ? projectData : [projectData];

  return projects.map((project: any) => formatProjectGantt(project));
};

// Helper to keep select query DRY
const getGanttSelectQuery = () => ({
  id: true,
  regNumber: true,
  progress: true,
  plannedStartDate: true,
  plannedEndDate: true,
  actualStartDate: true,
  actualEndDate: true,
  contract: {
    select: {
      title: true,
    },
  },
  milestones: {
    orderBy: { order: "asc" },
    select: {
      id: true,
      order: true,
      title: true,
      plannedStartDate: true,
      plannedEndDate: true,
      actualStartDate: true,
      actualEndDate: true,
      progress: true,
      stages: {
        select: {
          type: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
      tasks: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          order: true,
          title: true,
          plannedStartDate: true,
          plannedEndDate: true,
          actualStartDate: true,
          actualEndDate: true,
          progress: true,
          stages: {
            select: {
              type: true,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
          assignee: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      },
    },
  },
});

// Helper to format single project
const formatProjectGantt = (projectData: any) => {
  const formattedData = {
    project: {
      id: projectData.id,
      name: projectData.contract?.title || "",
      regNumber: projectData.regNumber || "",
      startDate: projectData.plannedStartDate || "",
      endDate: projectData.plannedEndDate || "",
      progress: projectData.progress || 0,
      type: "project",
    },
    milestones: projectData.milestones.map((milestone: any) => ({
      id: milestone.id,
      order: milestone.order || 0,
      title: milestone.title || "",
      progress: milestone.progress || 0,
      plannedStart: milestone.plannedStartDate || "",
      plannedEnd: milestone.plannedEndDate || "",
      actualStart: milestone.actualStartDate || milestone.approvedDate || "",
      actualEnd: milestone.actualEndDate || "",
      stageName: milestone.stages[0]?.type || "",
      tasks: milestone.tasks.map((task: any) => ({
        id: task.id,
        order: task.order || 0,
        title: task.title || "",
        progress: task.progress || 0,
        plannedStart: task.plannedStartDate || "",
        plannedEnd: task.plannedEndDate || "",
        actualStart: task.actualStartDate || "",
        actualEnd: task.actualEndDate || "",
        stageName: task.stages[0]?.type || "",
        assignee: task.assignee?.name || "",
      })),
    })),
  };

  // Calculate summary
  let totalTasks = 0;
  let completedTasks = 0;

  formattedData.milestones.forEach((milestone: any) => {
    totalTasks += milestone.tasks.length;
    milestone.tasks.forEach((task: any) => {
      if (task.progress === 100) completedTasks++;
    });
  });

  return {
    ...formattedData,
    summary: {
      totalTasks,
      completedTasks,
      overallProgress: projectData.progress || 0,
    },
  };
};
