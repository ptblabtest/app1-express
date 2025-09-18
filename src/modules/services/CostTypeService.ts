import prisma from "@/lib/prisma";
import { prepareForView } from "@/utils/query/prepareForView";
import { z } from "zod";

const costTypeSchema = z.object({
  order: z.number().optional().nullable(),
  name: z.string().min(1, "Name is required"),
  parentId: z.string().optional().nullable(),
});

const COST_TYPE_SELECT = {
  id: true,
  order: true,
  name: true,
  parentId: true,
  parent: {
    select: {
      id: true,
      name: true,
    },
  },
  children: {
    select: {
      id: true,
      name: true,
    },
  },
};

const transformCostType = (costType: any) => {
  const prepared = prepareForView(costType);

  prepared.parentId = prepared.parentId || null;
  prepared.parentName = prepared.parent?.name || null;
  prepared.level = prepared.parentId ? "Child" : "Parent";
  prepared.isParent = !prepared.parentId;
  prepared.childrenCount = prepared.children?.length || 0;

  delete prepared.parent;
  delete prepared.children;

  return prepared;
};

export const costTypeService = {
  create: async (data: any, user: any) => {
    const validatedData = await costTypeSchema.parseAsync(data);

    const costType = await prisma.costType.create({
      data: {
        ...validatedData,
        createdById: user.id,
      },
      select: COST_TYPE_SELECT,
    });

    return transformCostType(costType);
  },

  update: async (id: string, data: any, user: any) => {
    const existingCostType = await prisma.costType.findUnique({
      where: { id },
    });

    if (!existingCostType) {
      throw new Error("Cost type not found");
    }

    const validatedData = await costTypeSchema.partial().parseAsync(data);

    const costType = await prisma.costType.update({
      where: { id },
      data: {
        ...validatedData,
        updatedById: user.id,
      },
      select: COST_TYPE_SELECT,
    });

    return transformCostType(costType);
  },

  findUnique: async (id: string) => {
    const costType = await prisma.costType.findUnique({
      where: { id },
      select: COST_TYPE_SELECT,
    });

    if (!costType) {
      throw new Error("Cost type not found");
    }

    return transformCostType(costType);
  },

  findMany: async (queryParams?: any) => {
    const { mode, ...restParams } = queryParams || {};

    const records = await prisma.costType.findMany({
      ...restParams,
      ...(mode === "parent" && {
        where: {
          parentId: null,
          ...restParams.where,
        },
      }),
      select: COST_TYPE_SELECT,
      orderBy: {
        order: "asc",
      },
    });

    const transformed = records.map(transformCostType);

    if (mode === "parent") {
      return transformed.sort(
        (a: any, b: any) => (a.order || 0) - (b.order || 0)
      );
    }

    // Hierarchical structure
    const parents = transformed
      .filter((r: any) => r.isParent)
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    const children = transformed.filter((r: any) => !r.isParent);

    const result: any[] = [];
    parents.forEach((parent: any) => {
      result.push(parent);
      const parentChildren = children
        .filter((c: any) => c.parentId === parent.id)
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
      result.push(...parentChildren);
    });

    return result;
  },

  upsert: async (data: any, user: any) => {
    const items = data.data;
    const results = [];
    const tempIdMapping: Record<string, string> = {};

    for (let index = 0; index < items.length; index++) {
      const item = { ...items[index] };

      const tempId = item.tempId;
      if (tempId) {
        delete item.tempId;
      }

      item.order = index + 1;

      if (item.parentId && tempIdMapping[item.parentId]) {
        item.parentId = tempIdMapping[item.parentId];
      }

      let result;
      if (item.id) {
        result = await costTypeService.update(item.id, item, user);
      } else {
        result = await costTypeService.create(item, user);
        if (tempId && result.id) {
          tempIdMapping[tempId] = result.id;
        }
      }

      results.push(result);
    }

    return results;
  },
};
