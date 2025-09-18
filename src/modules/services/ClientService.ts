import prisma from "@/lib/prisma";
import { prepareForView } from "@/utils/query/prepareForView";
import { applyRegNumber } from "@/utils/mutation/regNumberGenerator";
import { z } from "zod";

const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email format").optional().nullable(),
  legal: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactRole: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  contactEmail: z.string().email("Invalid email format").optional().nullable(),
  taxNumber: z.string().optional().nullable(),
  taxAddress: z.string().optional().nullable(),
  taxStatus: z.boolean().optional().nullable(),
  procurementName: z.string().optional().nullable(),
  procurementRole: z.string().optional().nullable(),
  procurementPhone: z.string().optional().nullable(),
  procurementEmail: z.string().email("Invalid email format").optional().nullable(),
  billingAddress: z.string().optional().nullable(),
  paymentName: z.string().optional().nullable(),
  paymentRole: z.string().optional().nullable(),
  paymentPhone: z.string().optional().nullable(),
  paymentEmail: z.string().email("Invalid email format").optional().nullable(),
  bankName: z.string().optional().nullable(),
  accountReferenceNumber: z.string().optional().nullable(),
  accountOwnerName: z.string().optional().nullable(),
  regNumber: z.string().optional().nullable(),
});

const CLIENT_SELECT = {
  id: true,
  regNumber: true,
  name: true,
  address: true,
  phone: true,
  email: true,
  legal: true,
  category: true,
  country: true,
  contactName: true,
  contactRole: true,
  contactPhone: true,
  contactEmail: true,
  taxNumber: true,
  taxAddress: true,
  taxStatus: true,
  procurementName: true,
  procurementRole: true,
  procurementPhone: true,
  procurementEmail: true,
  billingAddress: true,
  paymentName: true,
  paymentRole: true,
  paymentPhone: true,
  paymentEmail: true,
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

const transformClient = (client: any) => {
  const prepared = prepareForView(client);
  
  prepared.legalName = `${prepared.name}, ${prepared.legal}`;
  
  return prepared;
};

export const clientService = {
  create: async (data: any, user: any) => {
    const validatedData = await clientSchema.parseAsync(data);

    const regNumber = await applyRegNumber("client", validatedData.regNumber || undefined);

    const client = await prisma.client.create({
      data: {
        ...validatedData,
        regNumber: regNumber || validatedData.regNumber,
        createdById: user.id,
      },
      select: CLIENT_SELECT,
    });

    return transformClient(client);
  },

  update: async (id: string, data: any, user: any) => {
    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      throw new Error("Client not found");
    }

    const validatedData = await clientSchema.partial().parseAsync(data);

    const client = await prisma.client.update({
      where: { id },
      data: {
        ...validatedData,
        updatedById: user.id,
      },
      select: CLIENT_SELECT,
    });

    return transformClient(client);
  },

  findMany: async (queryParams?: any) => {
    const clients = await prisma.client.findMany({
      ...queryParams,
      select: CLIENT_SELECT,
    });

    return clients.map(transformClient);
  },

  findUnique: async (id: string) => {
    const client = await prisma.client.findUnique({
      where: { id },
      select: CLIENT_SELECT,
    });

    if (!client) {
      throw new Error("Client not found");
    }

    return transformClient(client);
  },
};