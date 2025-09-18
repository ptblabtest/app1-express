import prisma from "@/lib/prisma";
import { prepareForView } from "@/utils/query/prepareForView";

const QUOTE_SELECT = {
  id: true,
  regNumber: true,
  title: true,
  currency: true,
  baseAmount: true,
  exchangeRate: true,
  amount: true,
  remarks: true,
  dueDate: true,
  releasedDate: true,
  approvedDate: true,
  expiredDate: true,
  clientId: true,
  opportunityId: true,
  createdAt: true,
  updatedAt: true,
  client: true,
  products: true,
  opportunity: true,
  contracts: true,
};

const transformQuote = (quote: any) => {
  const prepared = prepareForView(quote);
  
  prepared.productIds = prepared.products?.map((product: any) => product.id) || [];
  prepared.products = prepared.products
    ?.map((product: any) => product.name)
    .join(", ") || "";

  prepared.opportunityCount = prepared.opportunity ? 1 : 0;
  prepared.opportunityNumber = prepared.opportunity?.regNumber || null;
  prepared.opportunityId = prepared.opportunity?.id || null;

  prepared.contractCount = prepared.contracts?.length || 0;
  prepared.clientName = prepared.client?.name || "";

  delete prepared.client;
  delete prepared.opportunity;
  delete prepared.contracts;

  return prepared;
};

export const quoteService = {
  findMany: async (queryParams?: any) => {
    const quotes = await prisma.quote.findMany({
      ...queryParams,
      select: QUOTE_SELECT,
    });

    return quotes.map(transformQuote);
  },

  findUnique: async (id: string) => {
    const quote = await prisma.quote.findUnique({
      where: { id },
      select: QUOTE_SELECT,
    });

    if (!quote) {
      throw new Error("Quote not found");
    }

    return transformQuote(quote);
  },

  update: async (id: string, data: any, user: any) => {
    // Check if quote exists
    const existingQuote = await prisma.quote.findUnique({
      where: { id },
    });

    if (!existingQuote) {
      throw new Error("Quote not found");
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

    const quote = await prisma.quote.update({
      where: { id },
      data: {
        ...updateData,
        updatedById: user.id,
      },
      select: QUOTE_SELECT,
    });

    return transformQuote(quote);
  },
};