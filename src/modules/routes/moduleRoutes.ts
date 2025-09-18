import { Router } from "express";
import { requireAuth, requireRole } from "@/auth/authMiddleware";
import selectRoutes from "@/modules/routes/SelectRoutes";
import userRoutes from "@/modules/routes/UserRoutes";
import accRoutes from "@/modules/routes/AccRoutes";
import crmRoutes from "@/modules/routes/CrmRoutes";
import extRoutes from "@/modules/routes/ExtRoutes";
import masterRoutes from "@/modules/routes/MasterRoutes";
import prjRoutes from "@/modules/routes/PrjRoutes";

const router = Router();

router.use(`/users`, requireAuth, requireRole(2), userRoutes);
router.use(`/select`, requireAuth, selectRoutes);
router.use(requireAuth, accRoutes);
router.use(requireAuth, crmRoutes);
router.use(requireAuth, extRoutes);
router.use(requireAuth, masterRoutes);
router.use(requireAuth, prjRoutes);

export default router;
