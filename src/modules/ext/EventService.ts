import prisma from "@/lib/prisma";
import { prepareForView } from "@/utils/query/prepareForView";
import { z } from "zod";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  url: z.string().url().optional().nullable(),
  pipelineId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
});

const EVENT_SELECT = {
  id: true,
  title: true,
  category: true,
  description: true,
  startDate: true,
  endDate: true,
  url: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
  updatedById: true,
  pipelineId: true,
  projectId: true,
  taskId: true,
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
  pipeline: {
    select: {
      id: true,
      regNumber: true,
      category: true,
    },
  },
  project: {
    select: {
      id: true,
      name: true,
      status: true,
    },
  },
  task: {
    select: {
      id: true,
      title: true,
      status: true,
    },
  },
};

const transformEvent = (event: any) => {
  const prepared = prepareForView(event);
  
  const transformed: any = {
    ...prepared,
    pipelineNumber: prepared.pipeline?.regNumber || null,
    projectName: prepared.project?.name || null,
    taskTitle: prepared.task?.title || null,
    relatedEntity: null,
  };
  
  // Determine which entity is related
  if (prepared.pipelineId) {
    transformed.relatedEntity = {
      type: 'pipeline',
      id: prepared.pipelineId,
      display: prepared.pipeline?.regNumber || 'Pipeline',
    };
  } else if (prepared.projectId) {
    transformed.relatedEntity = {
      type: 'project',
      id: prepared.projectId,
      display: prepared.project?.name || 'Project',
    };
  } else if (prepared.taskId) {
    transformed.relatedEntity = {
      type: 'task',
      id: prepared.taskId,
      display: prepared.task?.title || 'Task',
    };
  }
  
  // Remove the raw relation objects
  delete transformed.pipeline;
  delete transformed.project;
  delete transformed.task;
  
  return transformed;
};

const validateEvent = (data: any) => {
  // Validate date logic
  if (data.startDate && data.endDate) {
    if (new Date(data.endDate) < new Date(data.startDate)) {
      throw new Error("End date must be after start date");
    }
  }
  
  // Validate only one related entity
  const relatedEntities = [
    data.pipelineId,
    data.projectId,
    data.taskId,
  ].filter(Boolean);
  
  if (relatedEntities.length > 1) {
    throw new Error("Event can only be related to one entity at a time");
  }
};

export const eventService = {
  create: async (data: any, user: any) => {
    const validatedData = await eventSchema.parseAsync(data);
    validateEvent(validatedData);
    
    const event = await prisma.event.create({
      data: {
        ...validatedData,
        createdById: user.id,
      },
      select: EVENT_SELECT,
    });
    
    return transformEvent(event);
  },
  
  update: async (id: string, data: any, user: any) => {
    const validatedData = await eventSchema.parseAsync(data);
    validateEvent(validatedData);
    
    const existingEvent = await prisma.event.findUnique({
      where: { id },
    });
    
    if (!existingEvent) {
      throw new Error("Event not found");
    }
    
    const event = await prisma.event.update({
      where: { id },
      data: {
        ...validatedData,
        updatedById: user.id,
      },
      select: EVENT_SELECT,
    });
    
    return transformEvent(event);
  },
  
  findMany: async (queryParams?: any) => {
    const events = await prisma.event.findMany({
      ...queryParams,
      select: EVENT_SELECT,
    });
    
    return events.map(transformEvent);
  },
  
  findUnique: async (id: string) => {
    const event = await prisma.event.findUnique({
      where: { id },
      select: EVENT_SELECT,
    });
    
    if (!event) {
      throw new Error("Event not found");
    }
    
    return transformEvent(event);
  },
  
  delete: async (id: string) => {
    const event = await prisma.event.delete({
      where: { id },
    });
    
    return { success: true, id };
  },
};