import { selectService } from "@/modules/services/SelectService";
import { Router } from "express";

const router = Router();

router.get("/:key", async (req: any, res: any): Promise<void> => {
  const { key } = req.params;
  const options = await selectService.fetchSelectOptions(key, req.query);
  res.json(options);
});

router.post("/:key", async (req: any, res: any) => {
  const { key } = req.params;
  const option = await selectService.createSelectOption(
    key,
    req.body,
    req.user
  );
  res.json(option);
});

export default router;
