import prisma from "@/lib/prisma";
import { prepareForView } from "@/utils/query/prepareForView";
import { setFieldAndStageForRelation } from "@/utils/mutation/setRelationStage";
import { calculateDuration } from "@/utils/query/calculateDuration";
import { calculateWeightedProgress } from "@/utils/query/calculateProgress";
import { z } from "zod";

const milestoneSchema = z.object({
  order: z.number().optional().nullable(),
  title: z.string().optional().nullable(),
  progress: z.number().optional().nullable(),
  deliverables: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  share: z.number().optional().nullable(),
  amount: z.number().optional().nullable(),
  plannedStartDate: z.coerce.date().optional().nullable(),
  plannedEndDate: z.coerce.date().optional().nullable(),
  actualStartDate: z.coerce.date().optional().nullable(),
  actualEndDate: z.coerce.date().optional().nullable(),
  projectId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  stages: z.any().optional().nullable(),
});

const MILESTONE_SELECT = {
  id: true,
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
  projectId: true,
  assigneeId: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
  updatedById: true,
  project: {
    select: {
      id: true,
      regNumber: true,
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
  tasks: {
    select: {
      id: true,
    },
  },
};

const transformMilestone = (milestone: any) => {
  const prepared = prepareForView(milestone);

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

  prepared.projectNumber = prepared.project?.regNumber || null;
  prepared.taskCount = prepared.tasks?.length || 0;

  delete prepared.project;
  delete prepared.tasks;

  return prepared;
};

export const milestoneService = {
  create: async (data: any, user: any) => {
    const validatedData = await milestoneSchema.parseAsync(data);

    const milestone = await prisma.milestone.create({
      data: {
        ...validatedData,
        createdById: user.id,
      },
      select: MILESTONE_SELECT,
    });

    return transformMilestone(milestone);
  },

  update: async (id: string, data: any, user: any) => {
    const existingMilestone = await prisma.milestone.findUnique({
      where: { id },
    });

    if (!existingMilestone) {
      throw new Error("Milestone not found");
    }

    const validatedData = await milestoneSchema.partial().parseAsync(data);

    const milestone = await prisma.milestone.update({
      where: { id },
      data: {
        ...validatedData,
        updatedById: user.id,
      },
      select: MILESTONE_SELECT,
    });

    return transformMilestone(milestone);
  },

  findMany: async (queryParams?: any) => {
    const milestones = await prisma.milestone.findMany({
      ...queryParams,
      select: MILESTONE_SELECT,
    });

    return milestones.map(transformMilestone);
  },

  findUnique: async (id: string) => {
    const milestone = await prisma.milestone.findUnique({
      where: { id },
      select: MILESTONE_SELECT,
    });

    if (!milestone) {
      throw new Error("Milestone not found");
    }

    return transformMilestone(milestone);
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
        result = await milestoneService.update(item.id, item, user);
      } else {
        result = await milestoneService.create(item, user);
      }

      results.push(result);
    }

    return results;
  },
};

export const updateMilestoneProgress = async (
  milestoneId: string,
  userId: string
) => {
  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    select: {
      actualEndDate: true,
      tasks: {
        select: {
          actualEndDate: true,
        },
      },
    },
  });

  if (!milestone) return;

  const milestoneProgress = await calculateWeightedProgress(milestoneId);

  const allTasksComplete =
    milestone.tasks.length > 0 &&
    milestone.tasks.every((task: any) => task.actualEndDate !== null);

  if (allTasksComplete) {
    await setFieldAndStageForRelation(
      milestoneId,
      "milestone",
      userId,
      "actualEndDate",
      "Done"
    );
  } else {
    if (milestone.actualEndDate) {
      await prisma.milestone.update({
        where: { id: milestoneId },
        data: { actualEndDate: null },
      });
    }

    if (milestoneProgress > 0 && milestoneProgress < 100) {
      await setFieldAndStageForRelation(
        milestoneId,
        "milestone",
        userId,
        "actualStartDate",
        "In Progress"
      );
    }
  }

  await prisma.milestone.update({
    where: { id: milestoneId },
    data: { progress: milestoneProgress },
  });
};