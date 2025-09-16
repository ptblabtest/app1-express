import prisma from "../../lib/prisma";
import { prepareForView } from "../../utils/query/prepareForView";

const ORGANIZATION_SELECT = {
  id: true,
  name: true,
  code: true,
};

export const organizationService = {
  findMany: async (queryParams?: any) => {
    const organizations = await prisma.organization.findMany({
      ...queryParams,
      select: ORGANIZATION_SELECT,
    });
    return organizations.map(prepareForView);
  },

  findUnique: async (id: string) => {
    const organization = await prisma.organization.findUnique({
      where: { id },
      select: ORGANIZATION_SELECT,
    });
    return organization ? prepareForView(organization) : null;
  },

  create: async (data: any) => {
    const organization = await prisma.organization.create({
      data,
      select: ORGANIZATION_SELECT,
    });
    return prepareForView(organization);
  },

  update: async (id: string, data: any) => {
    const organization = await prisma.organization.update({
      where: { id },
      data,
      select: ORGANIZATION_SELECT,
    });
    return prepareForView(organization);
  },
};