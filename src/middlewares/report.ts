import prisma from "@/lib/prisma";
import { requireOrg } from "@/middlewares/auth";
import { requirePermission } from "@/middlewares/permission";

export const requireReportPermission = (
  action: string,
  maxLevel: number = 2
) => {
  return async (req: any, res: any, next: any) => {
    try {
      // Check role first
      if (req.user.roleId) {
        if (!req.user.role) {
          const role = await prisma.role.findUnique({
            where: { id: req.user.roleId },
          });
          req.user.role = role as any;
        }

        if (req.user.role && req.user.role.level <= maxLevel) {
          return next();
        }
      }

      // Role check failed, check org + permission
      requireOrg(req, res, async (err: any) => {
        if (err) {
          return res
            .status(403)
            .json({ message: "Organization membership required" });
        }

        try {
          let categoryCode: string | null = null;

          if (action === "create") {
            const { categoryId } = req.body;
            if (!categoryId) {
              return res
                .status(400)
                .json({ message: "Category ID is required" });
            }

            const category = await prisma.reportCategory.findUnique({
              where: { id: categoryId },
              select: { code: true },
            });

            if (!category) {
              return res.status(404).json({ message: "Category not found" });
            }

            categoryCode = category.code;
          } else if (["read", "update", "delete"].includes(action)) {
            const reportId = req.params.id;
            if (reportId) {
              const report = await prisma.report.findUnique({
                where: { id: reportId },
                select: {
                  category: {
                    select: { code: true },
                  },
                },
              });

              if (!report) {
                return res.status(404).json({ message: "Report not found" });
              }
              categoryCode = report.category.code;
            } else {
              // Get all report permissions for this action
              const permissions = await prisma.permission.findMany({
                where: {
                  name: {
                    startsWith: "report.",
                    endsWith: `.${action}`,
                  },
                },
              });

              const permissionIds = permissions.map((p) => p.id);

              // Check if user has ANY of these permission IDs
              const userPermission = await prisma.userPermission.findFirst({
                where: {
                  userId: req.user.id,
                  permissionId: { in: permissionIds },
                },
              });

              if (!userPermission) {
                return res.status(403).json({
                  message: "Insufficient permissions",
                });
              }

              return next();
            }
          }

          // For specific category operations
          const permission = `report.${categoryCode.toLowerCase()}.${action}`;
          return requirePermission(permission)(req, res, next);
        } catch (error: any) {
          return res.status(500).json({ message: error.message });
        }
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  };
};


export const requireReportCategoryPermission = (
  action: string,
  maxLevel: number = 2
) => {
  return async (req: any, res: any, next: any) => {
    try {
      // Check role first
      if (req.user.roleId) {
        if (!req.user.role) {
          const role = await prisma.role.findUnique({
            where: { id: req.user.roleId },
          });
          req.user.role = role as any;
        }
        
        if (req.user.role && req.user.role.level <= maxLevel) {
          return next();
        }
      }
      
      // Role level exceeds maxLevel - add filter to request
      if (action === "read" && !req.params.id) {
        // Get user's report permissions
        const userPermissions = await prisma.userPermission.findMany({
          where: {
            userId: req.user.id,
          },
          include: {
            permission: true,
          },
        });
        
        // Extract category codes from permissions
        const categoryCodesLower = userPermissions
          .filter(up => 
            up.permission.name.startsWith("report.") && 
            up.permission.name.endsWith(".read")
          )
          .map(up => {
            const parts = up.permission.name.split(".");
            return parts[1]; // lowercase category code
          });
        
        console.log("User permission codes (lowercase):", categoryCodesLower);
        
        if (categoryCodesLower.length === 0) {
          // Return empty data instead of error
          return res.json({
            data: [],
            meta: { total: 0 },
          });
        }
        
        // Find categories with these codes (case-insensitive)
        const categories = await prisma.reportCategory.findMany({
          where: {
            code: {
              in: categoryCodesLower.map(c => c.toUpperCase()), // Try uppercase
              mode: 'insensitive' // Case insensitive search
            }
          },
          select: { code: true }
        });
        
        console.log("Found categories:", categories);
        
        // Add to query params
        req.query.where = {
          ...req.query.where,
          code: {
            in: categories.map(c => c.code)
          }
        };
      }
      
      return next();
      
    } catch (error: any) {
      console.error("Permission check error:", error);
      return res.status(500).json({ message: error.message });
    }
  };
};