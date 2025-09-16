import { serviceFactory } from "@/utils/serviceFactory";
import { z } from "zod";

const clientService = {
  ...serviceFactory("client", {
    operations: ["create", "update", "findMany", "findUnique"],
    schema: z.object({
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
      contactEmail: z
        .string()
        .email("Invalid email format")
        .optional()
        .nullable(),
      taxNumber: z.string().optional().nullable(),
      taxAddress: z.string().optional().nullable(),
      taxStatus: z.boolean().optional().nullable(),
      procurementName: z.string().optional().nullable(),
      procurementRole: z.string().optional().nullable(),
      procurementPhone: z.string().optional().nullable(),
      procurementEmail: z
        .string()
        .email("Invalid email format")
        .optional()
        .nullable(),
      billingAddress: z.string().optional().nullable(),
      paymentName: z.string().optional().nullable(),
      paymentRole: z.string().optional().nullable(),
      paymentPhone: z.string().optional().nullable(),
      paymentEmail: z
        .string()
        .email("Invalid email format")
        .optional()
        .nullable(),
      bankName: z.string().optional().nullable(),
      accountReferenceNumber: z.string().optional().nullable(),
      accountOwnerName: z.string().optional().nullable(),
      regNumber: z.string().optional().nullable(),
    }),
    queryOptions: {
      select: {
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
        createdBy: {
          select: {
            username: true,
          },
        },
        updatedBy: {
          select: {
            username: true,
          },
        },
      },
    },
    transformData: (result: any) => {
      result.legalName = `${result.name}, ${result.legal}`;

      return result;
    },
  }),
};

const vendorService = {
  ...serviceFactory("vendor", {
    operations: ["create", "update", "findMany", "findUnique"],
    schema: z.object({
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
      contactEmail: z
        .string()
        .email("Invalid email format")
        .optional()
        .nullable(),
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
    }),
    queryOptions: {
      select: {
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
        createdBy: {
          select: {
            username: true,
          },
        },
        updatedBy: {
          select: {
            username: true,
          },
        },
      },
    },
    transformData: (result: any) => {
      result.legalName = `${result.name}, ${result.legal}`;

      return result;
    },
  }),
};

const productService = {
  ...serviceFactory("product", {
    operations: ["create", "update", "findMany", "findUnique"],
    schema: z.object({
      regNumber: z.string().optional().nullable(),
      name: z.string().min(1, "Name is required"),
      remarks: z.string().optional().nullable(),
    }),
    queryOptions: {
      select: {
        id: true,
        regNumber: true,
        name: true,
        remarks: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: {
            username: true,
          },
        },
        updatedBy: {
          select: {
            username: true,
          },
        },
      },
    },
  }),
};

export { clientService, vendorService, productService };
