import prisma from "../lib/prisma";

const checkWildcardPermission = (
  permissions: string[],
  required: string
): boolean => {
  const parts = required.split(".");

  // Check progressively broader wildcards
  for (let i = parts.length - 1; i > 0; i--) {
    const wildcard = parts.slice(0, i).join(".") + ".*";
    if (permissions.includes(wildcard)) return true;
  }

  // Check full wildcard
  return permissions.includes("*");
};

const checkUserPermission = async (
  userId: string,
  requiredPermission: string
): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      department: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
      permissions: {
        include: { permission: true },
      },
    },
  });

  if (!user) return false;

  const allPermissions = new Set<string>();

  // Add department permissions
  user.department?.permissions.forEach((dp: any) => {
    allPermissions.add(dp.permission.name);
  });

  // Add user-specific permissions
  user.permissions.forEach((up: any) => {
    allPermissions.add(up.permission.name);
  });

  // Check exact match
  if (allPermissions.has(requiredPermission)) return true;

  // Check wildcards
  return checkWildcardPermission(
    Array.from(allPermissions),
    requiredPermission
  );
};

export const requirePermission = (permission: string) => {
  return async (req: any, res: any, next: any) => {
    const hasPermission = await checkUserPermission(req.user.id, permission);

    if (!hasPermission) {
      return res.status(403).json({
        message: "Insufficient permissions",
        required: permission,
      });
    }

    next();
  };
};

export const requireAnyPermission = (permissions: string[]) => {
  return async (req: any, res: any, next: any) => {
    // Added 'return' here
    for (const permission of permissions) {
      const hasPermission = await checkUserPermission(req.user.id, permission);
      if (hasPermission) {
        return next();
      }
    }
    return res.status(403).json({
      message: "Insufficient permissions",
      required: permissions,
    });
  };
};

export const requireAllPermissions = (permissions: string[]) => {
  return async (req: any, res: any, next: any) => {
    for (const permission of permissions) {
      const hasPermission = await checkUserPermission(req.user.id, permission);
      if (!hasPermission) {
        return res.status(403).json({
          message: "Insufficient permissions",
          required: permission,
        });
      }
    }

    next();
  };
};
