import prisma from "@/lib/prisma";
import { prepareForView } from "@/utils/query/prepareForView";

const OPPORTUNITY_SELECT = {
  id: true,
  regNumber: true,
  title: true,
  currency: true,
  baseAmount: true,
  exchangeRate: true,
  amount: true,
  remarks: true,
  dueDate: true,
  approvedDate: true,
  clientId: true,
  leadId: true,
  createdAt: true,
  updatedAt: true,
  client: true,
  products: true,
  lead: true,
  quotes: true,
};

const transformOpportunity = (opportunity: any) => {
  const prepared = prepareForView(opportunity);

  prepared.productIds =
    prepared.products?.map((product: any) => product.id) || [];
  prepared.products =
    prepared.products?.map((product: any) => product.name).join(", ") || "";

  prepared.leadCount = prepared.lead ? 1 : 0;
  prepared.leadNumber = prepared.lead?.regNumber || null;
  prepared.leadId = prepared.lead?.id || null;

  prepared.quoteCount = prepared.quotes?.length || 0;
  prepared.clientName = prepared.client?.name || "";

  delete prepared.client;
  delete prepared.lead;
  delete prepared.quotes;

  return prepared;
};

export const opportunityService = {
  findMany: async (queryParams?: any) => {
    const opportunities = await prisma.opportunity.findMany({
      ...queryParams,
      select: OPPORTUNITY_SELECT,
    });

    return opportunities.map(transformOpportunity);
  },

  findUnique: async (id: string) => {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      select: OPPORTUNITY_SELECT,
    });

    if (!opportunity) {
      throw new Error("Opportunity not found");
    }

    return transformOpportunity(opportunity);
  },
};
