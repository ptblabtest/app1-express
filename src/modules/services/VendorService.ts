import prisma from "@/lib/prisma";
import { prepareForView } from "@/utils/query/prepareForView";
import { applyRegNumber } from "@/utils/mutation/regNumberGenerator";
import { z } from "zod";

const vendorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email format").optional().nullable(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  legal: z.string().optional().nullable(),
  vendorCategory: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactRole: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  contactEmail: z.string().email("Invalid email format").optional().nullable(),
  taxNumber: z.string().optional().nullable(),
  taxStatus: z.boolean().optional().nullable(),
  siupNumber: z.string().optional().nullable(),
  nibNumber: z.string().optional().nullable(),
  pkpNumber: z.string().optional().nullable(),
  productType: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  accountReferenceNumber: z.string().optional().nullable(),
  accountOwnerName: z.string().optional().nullable(),
  regNumber: z.string().optional().nullable(),
});

const VENDOR_SELECT = {
  id: true,
  regNumber: true,
  name: true,
  address: true,
  phone: true,
  email: true,
  city: true,
  postalCode: true,
  legal: true,
  vendorCategory: true,
  contactName: true,
  contactRole: true,
  contactPhone: true,
  contactEmail: true,
  taxNumber: true,
  taxStatus: true,
  siupNumber: true,
  nibNumber: true,
  pkpNumber: true,
  productType: true,
  description: true,
  bankName: true,
  accountReferenceNumber: true,
  accountOwnerName: true,
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

const transformVendor = (vendor: any) => {
  const prepared = prepareForView(vendor);
  
  prepared.legalName = `${prepared.name}, ${prepared.legal}`;
  
  return prepared;
};

export const vendorService = {
  create: async (data: any, user: any) => {
    const validatedData = await vendorSchema.parseAsync(data);

    const regNumber = await applyRegNumber("vendor", validatedData.regNumber || undefined);

    const vendor = await prisma.vendor.create({
      data: {
        ...validatedData,
        regNumber: regNumber || validatedData.regNumber,
        createdById: user.id,
      },
      select: VENDOR_SELECT,
    });

    return transformVendor(vendor);
  },

  update: async (id: string, data: any, user: any) => {
    const existingVendor = await prisma.vendor.findUnique({
      where: { id },
    });

    if (!existingVendor) {
      throw new Error("Vendor not found");
    }

    const validatedData = await vendorSchema.partial().parseAsync(data);

    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        ...validatedData,
        updatedById: user.id,
      },
      select: VENDOR_SELECT,
    });

    return transformVendor(vendor);
  },

  findMany: async (queryParams?: any) => {
    const vendors = await prisma.vendor.findMany({
      ...queryParams,
      select: VENDOR_SELECT,
    });

    return vendors.map(transformVendor);
  },

  findUnique: async (id: string) => {
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      select: VENDOR_SELECT,
    });

    if (!vendor) {
      throw new Error("Vendor not found");
    }

    return transformVendor(vendor);
  },
};