import { Router } from "express";

import userPermissionRoutes from "../modules/user-permission/UserPermissionRoutes";
import permissionRoutes from "../modules/permission/PermissionRoutes";
import userRoutes from "../modules/user/UserRoutes";
import extensionRoutes from "../modules/extension/ExtensionRoutes";
import selectRoutes from "../modules/select/SelectRoutes";
import { requireRole } from "../middlewares/auth";

const router = Router();

// router.use(extensionRoutes);
// router.use(`/user-permissions`, requireRole(2), userPermissionRoutes);
router.use(`/users`, userRoutes);
// router.use(permissionRoutes);
router.use(selectRoutes);

export default router;
