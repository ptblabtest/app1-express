import prisma from "@/lib/prisma";
import { reportPermissionService } from "./ReportPermissionService";
import { Router } from "express";

const router = Router();

router.post("/:userId", async (req: any, res: any) => {
  const { userId } = req.params;
  const { permissions } = req.body;

  if (!permissions) {
    return res.status(400).json({
      error: "permissions object is required",
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: {
        select: { level: true },
      },
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (user.role?.level <= 2) {
    return res.status(400).json({
      error: "User with role level 2 or below does not need permissions",
    });
  }

  const result = await reportPermissionService.bulkReplaceByCategories(
    userId,
    permissions
  );

  res.json(result);
});

router.get("/:userId", async (req: any, res: any) => {
  const { userId } = req.params;

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: {
        select: { level: true },
      },
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (user.role?.level <= 2) {
    return res.status(400).json({
      error: "User with role level 2 or below does not need permissions",
    });
  }

  const matrix = await reportPermissionService.getUserPermissionMatrix(userId);
  res.json(matrix);
});

export default router;
