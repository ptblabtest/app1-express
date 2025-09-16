import prisma from "../../lib/prisma";
import { userPermissionService } from "./UserPermissionService";
import { Router } from "express";

const router = Router();

// Get single permission assignment - using existing findUnique
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        error: "userId is required",
      });
    }

    const result = await userPermissionService.findByUserId(userId);

    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      error: error.message || "Failed to fetch user permissions",
    });
  }
});

router.post("/bulk-replace", async (req, res) => {
  try {
    const { userId, permissionIds } = req.body;

    if (!userId || !Array.isArray(permissionIds)) {
      return res.status(400).json({
        error: "userId and permissionIds array are required"
      });
    }

    // Check user's role level
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: {
          select: {
            level: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role?.level && user.role.level <= 2) {
      return res.status(400).json({ 
        error: "Users with role level 2 or below do not need assigned permissions" 
      });
    }

    const result = await userPermissionService.bulkReplace(userId, permissionIds);
    
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ 
      error: error.message || "Failed to bulk replace permissions" 
    });
  }
});

export default router;
