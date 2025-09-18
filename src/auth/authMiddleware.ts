import prisma from "../lib/prisma";

export const requireAuth = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  // Double-check status (defensive programming)
  if (req.user.status !== "ACTIVE") {
    return res.status(403).json({ message: "Account is not active" });
  }

  next();
};

export const requireRole = (maxLevel: number) => {
  return async (req: any, res: any, next: any) => {
    // No role assigned at all
    if (!req.user.role) {
      return res.status(403).json({ message: "No role assigned to user" });
    }

    // Load role if not already loaded
    if (!req.user.role) {
      const role = await prisma.role.findUnique({
        where: { id: req.user.roleId },
      });
      req.user.role = role as any;
    }

    // Check if user level is LOW enough (lower = more access)
    if (!req.user.role || req.user.role.level > maxLevel) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
};
