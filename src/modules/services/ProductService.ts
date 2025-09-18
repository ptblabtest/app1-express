import prisma from "@/lib/prisma";
import { prepareForView } from "@/utils/query/prepareForView";
import { applyRegNumber } from "@/utils/mutation/regNumberGenerator";
import { z } from "zod";

const productSchema = z.object({
  regNumber: z.string().optional().nullable(),
  name: z.string().min(1, "Name is required"),
  remarks: z.string().optional().nullable(),
});

const PRODUCT_SELECT = {
  id: true,
  regNumber: true,
  name: true,
  remarks: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
  updatedById: true,
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

const transformProduct = (product: any) => {
  return prepareForView(product);
};

export const productService = {
  create: async (data: any, user: any) => {
    const validatedData = await productSchema.parseAsync(data);

    const regNumber = await applyRegNumber("product", validatedData.regNumber || undefined);

    const product = await prisma.product.create({
      data: {
        ...validatedData,
        regNumber: regNumber || validatedData.regNumber,
        createdById: user.id,
      },
      select: PRODUCT_SELECT,
    });

    return transformProduct(product);
  },

  update: async (id: string, data: any, user: any) => {
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new Error("Product not found");
    }

    const validatedData = await productSchema.partial().parseAsync(data);

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...validatedData,
        updatedById: user.id,
      },
      select: PRODUCT_SELECT,
    });

    return transformProduct(product);
  },

  findMany: async (queryParams?: any) => {
    const products = await prisma.product.findMany({
      ...queryParams,
      select: PRODUCT_SELECT,
    });

    return products.map(transformProduct);
  },

  findUnique: async (id: string) => {
    const product = await prisma.product.findUnique({
      where: { id },
      select: PRODUCT_SELECT,
    });

    if (!product) {
      throw new Error("Product not found");
    }

    return transformProduct(product);
  },
};