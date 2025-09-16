import { Router } from "express";
import { permissionService } from "./PermissionService";
import { requireAuth, requireRole } from "../../middlewares/auth";

const router = Router();

// Get all permissions
router.get(
  "/permissions",
  requireAuth,
  requireRole(3), // Managers can view
  async (req: any, res: any) => {
    const permissions = await permissionService.findMany();
    res.json(permissions);
  }
);

router.post(
  "/permissions/upsert",
  requireAuth,
  // requireRole(1),
  async (req: any, res: any) => {
    // Expecting: { data: [{ id?, resource, action, description }, ...] }
    const result = await permissionService.upsert(req.body, req.user);
    res.json(result);
  }
);

// Get permissions grouped by resource (for UI)
router.get(
  "/permissions/grouped",
  requireAuth,
  requireRole(3),
  async (req: any, res: any) => {
    const permissions = await permissionService.findMany();

    // Group by resource for better UI display
    const grouped = permissions.reduce((acc: any, perm: any) => {
      if (!acc[perm.resource]) {
        acc[perm.resource] = [];
      }
      acc[perm.resource].push(perm);
      return acc;
    }, {});

    res.json(grouped);
  }
);

// Create new permission
router.post(
  "/permissions",
  requireAuth,
  requireRole(1), // Only super admin
  async (req: any, res: any) => {
    const permission = await permissionService.create(req.body, req.user);
    res.json(permission);
  }
);

// Update permission
router.patch(
  "/permissions/:id",
  requireAuth,
  requireRole(1),
  async (req: any, res: any) => {
    const permission = await permissionService.update(
      req.body,
      req.params.id,
      req.user
    );
    res.json(permission);
  }
);

// Delete permission
router.delete(
  "/permissions/:id",
  requireAuth,
  requireRole(1),
  async (req: any, res: any) => {
    const result = await permissionService.delete(req.params.id);
    res.json(result);
  }
);

export default router;
