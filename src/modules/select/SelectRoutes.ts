import { Router } from "express";
import { SelectService } from "./SelectService";
import { requireAuth } from "../../middlewares/auth";

const router = Router();

router.get(
  "/select/:key",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    const { key } = req.params;
    try {
      const options = await SelectService.fetchSelectOptions(key, req.query);
      res.json(options);
    } catch (err: any) {
      console.error(err);
      res.status(400).json({ message: err.message });
    }
  }
);

router.post(
  "/select/:key",
  requireAuth,
  async (req: any, res: any) => {
    const { key } = req.params;
    try {
      const option = await SelectService.createSelectOption(key, req.body, req.user);
      res.json(option);
    } catch (err: any) {
      console.error(err);
      res.status(400).json({ message: err.message });
    }
  }
);

export default router;
