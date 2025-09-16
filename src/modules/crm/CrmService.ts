import { calculateDuration } from "@/utils/query/calculateDuration";
import { serviceFactory } from "@/utils/serviceFactory";

const leadService = {
  ...serviceFactory("lead", {
    operations: ["findMany", "findUnique", "update"],
    queryOptions: {
      select: {
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
      },
    },
    transformData: (result: any) => {
      result.productIds = result.products?.map((product: any) => product.id);
      result.products = result.products
        ?.map((product: any) => product.name)
        .join(", ");
      result.opportunityCount = result.opportunities?.length || 0;
      result.clientName = result.client?.name;

      delete result.opportunities;
      delete result.client;

      return result;
    },
    beforeUpdate: async (data: any, id: string, user: any) => {
      if (data.productIds !== undefined) {
        if (data.productIds.length > 0) {
          data.products = {
            set: data.productIds.map((id: string) => ({ id })),
          };
        } else {
          data.products = {
            set: [],
          };
        }
        delete data.productIds;
      }

      return data;
    },
  }),
};

const opportunityService = {
  ...serviceFactory("opportunity", {
    operations: ["findMany", "findUnique"],
    queryOptions: {
      select: {
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
      },
    },
    transformData: (result: any) => {
      result.productIds = result.products?.map((product: any) => product.id);
      result.products = result.products
        ?.map((product: any) => product.name)
        .join(", ");

      result.leadCount = result.lead?.length || 0;
      result.leadNumber = result.lead?.regNumber;
      result.leadId = result.lead?.id;

      result.quoteCount = result.quotes?.length || 0;
      result.clientName = result.client?.name;

      delete result.client;

      delete result.lead;
      delete result.quotes;

      return result;
    },
    beforeUpdate: async (data: any, id: string, user: any) => {
      if (data.productIds !== undefined) {
        if (data.productIds.length > 0) {
          data.products = {
            set: data.productIds.map((id: string) => ({ id })),
          };
        } else {
          data.products = {
            set: [],
          };
        }
        delete data.productIds;
      }

      return data;
    },
  }),
};

const quoteService = {
  ...serviceFactory("quote", {
    operations: ["findMany", "findUnique", "update"],
    queryOptions: {
      select: {
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
      },
    },
    transformData: (result: any) => {
      result.productIds = result.products?.map((product: any) => product.id);
      result.products = result.products
        ?.map((product: any) => product.name)
        .join(", ");

      result.opportunityCount = result.opportunity?.length || 0;
      result.opportunityNumber = result.opportunity?.regNumber;
      result.opportunityId = result.opportunity?.id;

      result.contractCount = result.contracts?.length || 0;
      result.clientName = result.client?.name;

      delete result.client;

      delete result.opportunity;
      delete result.contracts;

      return result;
    },
    beforeUpdate: async (data: any, id: string, user: any) => {
      if (data.productIds !== undefined) {
        if (data.productIds.length > 0) {
          data.products = {
            set: data.productIds.map((id: string) => ({ id })),
          };
        } else {
          data.products = {
            set: [],
          };
        }
        delete data.productIds;
      }

      return data;
    },
  }),
};

const contractService = {
  ...serviceFactory("contract", {
    operations: ["findMany", "findUnique"],
    queryOptions: {
      select: {
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
      },
    },
    transformData: (result: any) => {
      result.productIds = result.products?.map((product: any) => product.id);
      result.products = result.products
        ?.map((product: any) => product.name)
        .join(", ");
      result.clientName = result.client?.name;

      result.projectId = result.project?.id;
      result.projectNumber = result.project?.regNumber;
      result.projectCount = result.project ? 1 : 0;

      result.quoteId = result.quote?.id;
      result.quoteNumber = result.quote?.regNumber;
      result.quoteCount = result.quote ? 1 : 0;

      if (result.startDate && result.endDate) {
        result.duration = calculateDuration(result.startDate, result.endDate);
      }

      delete result.client;
      delete result.project;
      delete result.quote;

      return result;
    },
    beforeUpdate: async (data: any, id: string, user: any) => {
      if (data.productIds !== undefined) {
        if (data.productIds.length > 0) {
          data.products = {
            set: data.productIds.map((id: string) => ({ id })),
          };
        } else {
          data.products = {
            set: [],
          };
        }
        delete data.productIds;
      }

      return data;
    },
  }),
};

export { leadService, opportunityService, quoteService, contractService };
