import prisma from "@/lib/prisma";
import { prepareForView } from "@/utils/query/prepareForView";
import { z } from "zod";

const reportSchema = z.object({
  categoryId: z.string(),
  periodYear: z.string(),
  periodMonth: z.string().optional(),
  organizationId: z.string().optional(),
  createdById: z.string().optional(),
});

const REPORT_SELECT = {
  id: true,
  categoryId: true,
  category: {
    select: {
      id: true,
      name: true,
      interval: true,
    },
  },
  periodYear: true,
  periodMonth: true,
  version: true,
  organizationId: true,
  organization: { select: { id: true, name: true } },
  files: {
    select: {
      id: true,
      url: true,
      key: true,
    },
  },
  createdAt: true,
  updatedAt: true,
  createdBy: {
    select: {
      profile: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  updatedBy: {
    select: {
      profile: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
};

const transformReport = (report: any) => {
  const prepared = prepareForView(report);
  return {
    ...prepared,
    fileId: report.files[0]?.id || null,
    fileUrl: report.files[0]?.url || null,
    files: undefined,
    categoryName: report.category?.name,
    createdByName: report.createdBy?.profile?.name,
    organizationName: report.organization?.name,
  };
};

const checkPermissions = async (
  user: any,
  categoryId: string,
  action: string
) => {
  // Level 1-2: Always allowed
  if (user.role.level <= 2) return true;

  // Level 3: No create allowed
  if (user.role.level === 3 && action === "create") return false;

  // Check category permission
  const hasPermission = await prisma.userPermission.findFirst({
    where: {
      userId: user.id,
      permission: {
        resource: `report:category:${categoryId}`,
        action,
      },
    },
  });

  return !!hasPermission;
};

export const reportService = {
  create: async (data: any, user: any) => {
    const validatedData = await reportSchema.parseAsync(data);

    // Check permissions
    if (!(await checkPermissions(user, validatedData.categoryId, "create"))) {
      throw new Error("Access denied");
    }

    // Level 3: Check organization
    if (
      user.role.level === 3 &&
      validatedData.organizationId !== user.organizationId
    ) {
      throw new Error("Access denied - wrong organization");
    }

    // Get category to check interval
    const category = await prisma.reportCategory.findUnique({
      where: { id: validatedData.categoryId },
      select: { interval: true },
    });

    if (!category) throw new Error("Category not found");

    // Validate period matches category interval
    if (category.interval === "monthly" && !validatedData.periodMonth) {
      throw new Error("Month is required for monthly reports");
    }

    if (category.interval === "yearly" && validatedData.periodMonth) {
      throw new Error("Month should not be provided for yearly reports");
    }

    // Check for existing report to determine version
    const existingReport = await prisma.report.findFirst({
      where: {
        categoryId: validatedData.categoryId,
        periodYear: validatedData.periodYear,
        periodMonth: validatedData.periodMonth || null,
        organizationId: validatedData.organizationId || user.organizationId,
      },
      orderBy: { version: "desc" },
      select: { version: true },
    });

    const processedData = {
      ...validatedData,
      periodMonth:
        category.interval === "yearly" ? null : validatedData.periodMonth,
      createdById: user.id,
      organizationId: validatedData.organizationId || user.organizationId,
      version: existingReport ? existingReport.version + 1 : 1,
    };

    const report = await prisma.report.create({
      data: processedData,
    });

    return report;
  },
  findMany: async (queryParams: any, user: any) => {
    let where = { ...queryParams?.where };

    // Apply permission filters based on role
    if (user.role.level > 2) {
      // Level 3: Organization filter
      if (user.role.level === 3) {
        where.organizationId = user.organizationId;
      }

      // Level 3-4: Category permission filter
      const permissions = await prisma.userPermission.findMany({
        where: {
          userId: user.id,
          permission: {
            resource: { startsWith: "report:category:" },
            action: "view",
          },
        },
        select: { permission: true },
      });

      const categoryIds = permissions.map((p: any) =>
        p.permission.resource.replace("report:category:", "")
      );

      where.categoryId = { in: categoryIds };
    }

    const reports = await prisma.report.findMany({
      ...queryParams,
      where,
      select: REPORT_SELECT,
    });

    return reports.map(transformReport);
  },

  findUnique: async (id: string, user: any) => {
    const report = await prisma.report.findUnique({
      where: { id },
      select: REPORT_SELECT,
    });

    if (!report) return null;

    // Check view permission
    if (!(await checkPermissions(user, report.categoryId, "view"))) {
      throw new Error("Access denied");
    }

    // Level 3: Check organization
    if (
      user.role.level === 3 &&
      report.organizationId !== user.organizationId
    ) {
      throw new Error("Access denied");
    }

    return transformReport(report);
  },
};
