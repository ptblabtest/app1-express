import prisma from "@/lib/prisma";
import { prepareForView } from "@/utils/query/prepareForView";

const LEAD_SELECT = {
  id: true,
  regNumber: true,
  name: true,
  role: true,
  email: true,
  phone: true,
  leadSource: true,
  leadDate: true,
  leadAddress: true,
  prospectLocation: true,
  remarks: true,
  dueDate: true,
  approvedDate: true,
  clientId: true,
  createdAt: true,
  updatedAt: true,
  client: true,
  products: true,
  opportunities: true,
};

const transformLead = (lead: any) => {
  const prepared = prepareForView(lead);
  
  prepared.productIds = prepared.products?.map((product: any) => product.id) || [];
  prepared.products = prepared.products
    ?.map((product: any) => product.name)
    .join(", ") || "";
  prepared.opportunityCount = prepared.opportunities?.length || 0;
  prepared.clientName = prepared.client?.name || "";

  delete prepared.opportunities;
  delete prepared.client;

  return prepared;
};

export const leadService = {
  findMany: async (queryParams?: any) => {
    const leads = await prisma.lead.findMany({
      ...queryParams,
      select: LEAD_SELECT,
    });

    return leads.map(transformLead);
  },

  findUnique: async (id: string) => {
    const lead = await prisma.lead.findUnique({
      where: { id },
      select: LEAD_SELECT,
    });

    if (!lead) {
      throw new Error("Lead not found");
    }

    return transformLead(lead);
  },

  update: async (id: string, data: any, user: any) => {
    // Check if lead exists
    const existingLead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!existingLead) {
      throw new Error("Lead not found");
    }

    // Handle productIds conversion
    let updateData = { ...data };
    
    if (updateData.productIds !== undefined) {
      if (updateData.productIds.length > 0) {
        updateData.products = {
          set: updateData.productIds.map((id: string) => ({ id })),
        };
      } else {
        updateData.products = { set: [] };
      }
      delete updateData.productIds;
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...updateData,
        updatedById: user.id,
      },
      select: LEAD_SELECT,
    });

    return transformLead(lead);
  },
};