import { pipelineService } from "@/modules/crm/PipelineService";
import { Router } from "express";

const router = Router();

// GET all pipelines
router.get("/", async (req, res) => {
  try {
    const pipelines = await pipelineService.findMany(req.query);
    res.json(pipelines);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET single pipeline
router.get("/:id", async (req, res) => {
  try {
    const pipeline = await pipelineService.findUnique(req.params.id);
    if (!pipeline) {
      return res.status(404).json({ error: "Pipeline not found" });
    }
    res.json(pipeline);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const id = await pipelineService.create(req.body, req.user);
    res.status(201).json({ id });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    console.log("PATCH /pipelines/:id");
    console.log("Pipeline ID:", req.params.id);
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("User:", req.user);
    
    const id = await pipelineService.update(req.params.id, req.body, req.user);
    
    console.log("Update successful, returned ID:", id);
    res.json({ id });
  } catch (error: any) {
    console.error("PATCH /pipelines/:id ERROR:");
    console.error("Error message:", error.message);
    console.error("Full error:", error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
