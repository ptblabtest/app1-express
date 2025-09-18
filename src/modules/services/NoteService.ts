import prisma from "@/lib/prisma";
import { prepareForView } from "@/utils/query/prepareForView";
import { z } from "zod";

const noteSchema = z.object({
  description: z.string().optional().nullable(),
  pipelineId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  milestoneId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
  budgetId: z.string().optional().nullable(),
  fundId: z.string().optional().nullable(),
  expenseId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  vendorId: z.string().optional().nullable(),
});

const NOTE_SELECT = {
  id: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
  updatedById: true,
  pipelineId: true,
  projectId: true,
  milestoneId: true,
  taskId: true,
  budgetId: true,
  fundId: true,
  expenseId: true,
  clientId: true,
  vendorId: true,
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

const transformNote = (note: any) => {
  return prepareForView(note);
};

export const noteService = {
  create: async (data: any, user: any) => {
    const validatedData = await noteSchema.parseAsync(data);

    const note = await prisma.note.create({
      data: {
        ...validatedData,
        createdById: user.id,
      },
      select: NOTE_SELECT,
    });

    return transformNote(note);
  },

  update: async (id: string, data: any, user: any) => {
    const existingNote = await prisma.note.findUnique({
      where: { id },
    });

    if (!existingNote) {
      throw new Error("Note not found");
    }

    const validatedData = await noteSchema.partial().parseAsync(data);

    const note = await prisma.note.update({
      where: { id },
      data: {
        ...validatedData,
        updatedById: user.id,
      },
      select: NOTE_SELECT,
    });

    return transformNote(note);
  },

  findMany: async (queryParams?: any) => {
    const notes = await prisma.note.findMany({
      ...queryParams,
      select: NOTE_SELECT,
    });

    return notes.map(transformNote);
  },

  findUnique: async (id: string) => {
    const note = await prisma.note.findUnique({
      where: { id },
      select: NOTE_SELECT,
    });

    if (!note) {
      throw new Error("Note not found");
    }

    return transformNote(note);
  },

  delete: async (id: string) => {
    const existingNote = await prisma.note.findUnique({
      where: { id },
    });

    if (!existingNote) {
      throw new Error("Note not found");
    }

    const note = await prisma.note.delete({
      where: { id },
    });

    return note;
  },
};