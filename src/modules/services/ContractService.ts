import prisma from "@/lib/prisma";
import { prepareForView } from "@/utils/query/prepareForView";
import { calculateDuration } from "@/utils/query/calculateDuration";

const CONTRACT_SELECT = {
  id: true,
  regNumber: true,
  title: true,
  currency: true,
  baseAmount: true,
  exchangeRate: true,
  amount: true,
  remarks: true,
  signedDate: true,
  startDate: true,
  endDate: true,
  penalty: true,
  clientPicName: true,
  clientId: true,
  quoteId: true,
  createdAt: true,
  updatedAt: true,
  client: true,
  products: true,
  project: true,
  quote: true,
};

const transformContract = (contract: any) => {
  const prepared = prepareForView(contract);

  prepared.productIds =
    prepared.products?.map((product: any) => product.id) || [];
  prepared.products =
    prepared.products?.map((product: any) => product.name).join(", ") || "";
  prepared.clientName = prepared.client?.name || "";

  prepared.projectId = prepared.project?.id || null;
  prepared.projectNumber = prepared.project?.regNumber || null;
  prepared.projectCount = prepared.project ? 1 : 0;

  prepared.quoteId = prepared.quote?.id || null;
  prepared.quoteNumber = prepared.quote?.regNumber || null;
  prepared.quoteCount = prepared.quote ? 1 : 0;

  if (prepared.startDate && prepared.endDate) {
    prepared.duration = calculateDuration(prepared.startDate, prepared.endDate);
  }

  delete prepared.client;
  delete prepared.project;
  delete prepared.quote;

  return prepared;
};

export const contractService = {
  findMany: async (queryParams?: any) => {
    const contracts = await prisma.contract.findMany({
      ...queryParams,
      select: CONTRACT_SELECT,
    });

    return contracts.map(transformContract);
  },

  findUnique: async (id: string) => {
    const contract = await prisma.contract.findUnique({
      where: { id },
      select: CONTRACT_SELECT,
    });

    if (!contract) {
      throw new Error("Contract not found");
    }

    return transformContract(contract);
  },
};
