import { Router } from "express";
import { requireAuth } from "../../middlewares/auth";
import { extensionService } from "./ExtensionService";

const router = Router();

router.post("/reg-number/:model", requireAuth, async (req: any, res: any) => {
  const modelName = req.params.model;
  const userId = req.user!.id;

  const results = await extensionService.createRegNumbersForModel(
    modelName,
    userId
  );

  res.status(201).json({
    message: `Registration numbers created for ${modelName}`,
    data: results,
  });
});

router.post("/revision/:model", requireAuth, async (req: any, res: any) => {
  const modelName = req.params.model;
  const userId = req.user!.id;

  const results = await extensionService.addRevisionForModel(modelName, userId);

  res.status(201).json({
    message: `Revisions initialized for ${modelName}`,
    data: results,
  });
});

export default router;
