import { serviceFactory } from "@/utils/serviceFactory";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { prepareForView } from "@/utils/query/prepareForView";

export const costTypeService = {
  ...serviceFactory("costType", {
    operations: ["create", "update", "findUnique", "upsert"],
    schema: z.object({
      order: z.number().optional().nullable(),
      name: z.string().min(1, "Name is required"),
      parentId: z.string().optional().nullable(),
    }),
    queryOptions: {
      select: {
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
      },
    },
    transformData: (result: any) => {
      result.parentId = result.parentId || null;
      result.parentName = result.parent?.name;
      result.level = result.parentId ? "Child" : "Parent";

      delete result.parent;

      result.childrenCount = result.children?.length || 0;

      delete result.children;

      return result;
    },
  }),
  findMany: async function (queryParams?: any) {
    const { mode, ...restParams } = queryParams || {};

    const records = await prisma.costType.findMany({
      ...restParams,
      ...(mode === "parent" && {
        where: {
          parentId: null,
          ...restParams.where,
        },
      }),
      select: {
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
      },
      orderBy: {
        order: "asc",
      },
    });

    // Transform data
    const transformed = records.map((record: any) => {
      const result = prepareForView(record);
      result.parentId = result.parentId || null;
      result.parentName = result.parent?.name;
      result.isParent = !result.parentId;
      delete result.parent;
      result.childrenCount = result.children?.length || 0;
      delete result.children;
      return result;
    });

    // If parent mode, just return sorted parents
    if (mode === "parent") {
      return transformed.sort(
        (a: any, b: any) => (a.order || 0) - (b.order || 0)
      );
    }

    // Original hierarchical logic for default mode
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
};
