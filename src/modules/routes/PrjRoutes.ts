import { projectService } from "@/modules/services/ProjectService";
import { milestoneService } from "@/modules/services/MilestoneService";
import { taskService } from "@/modules/services/TaskService";
import { Router } from "express";

const router = Router();

// Project routes
router.get("/projects", async (req, res) => {
  const projects = await projectService.findMany(req.query);
  res.json({
    data: projects,
    meta: { total: projects.length },
  });
});

router.get("/projects/:id", async (req, res) => {
  const project = await projectService.findUnique(req.params.id);
  res.json({ data: project });
});

router.post("/projects", async (req, res) => {
  const project = await projectService.create(req.body, req.user);
  res.status(201).json({
    message: "Data created successfully",
    data: { id: project.id },
  });
});

router.patch("/projects/:id", async (req, res) => {
  const project = await projectService.update(req.params.id, req.body, req.user);
  res.status(200).json({
    message: "Data updated successfully",
    data: { id: project.id },
  });
});

router.get("/projects/:id/budget-comparison", async (req, res) => {
  const { showAll } = req.query;
  const comparison = await projectService.getBudgetComparison(
    req.params.id,
    showAll === "true"
  );
  res.json({ data: comparison });
});

router.get("/projects/:id/gantt", async (req, res) => {
  const ganttData = await projectService.getGanttData(req.params.id);
  res.json({ data: ganttData });
});

router.get("/projects/:id/scurve", async (req, res) => {
  const { intervalType } = req.query;
  const scurveData = await projectService.getScurveData(
    req.params.id,
    intervalType as "daily" | "weekly" | "monthly" | "quarterly"
  );
  res.json({ data: scurveData });
});

// Milestone routes
router.get("/milestones", async (req, res) => {
  const milestones = await milestoneService.findMany(req.query);
  res.json({
    data: milestones,
    meta: { total: milestones.length },
  });
});

router.get("/milestones/:id", async (req, res) => {
  const milestone = await milestoneService.findUnique(req.params.id);
  res.json({ data: milestone });
});

router.post("/milestones", async (req, res) => {
  const milestone = await milestoneService.create(req.body, req.user);
  res.status(201).json({
    message: "Data created successfully",
    data: { id: milestone.id },
  });
});

router.patch("/milestones/:id", async (req, res) => {
  const milestone = await milestoneService.update(req.params.id, req.body, req.user);
  res.status(200).json({
    message: "Data updated successfully",
    data: { id: milestone.id },
  });
});

router.patch("/milestones/upsert", async (req, res) => {
  const records = await milestoneService.upsert(req.body, req.user);
  res.status(200).json({
    message: "Data upserted successfully",
    data: records.map((record: any) => ({ id: record.id })),
  });
});

// Task routes
router.get("/tasks", async (req, res) => {
  const tasks = await taskService.findMany(req.query);
  res.json({
    data: tasks,
    meta: { total: tasks.length },
  });
});

router.get("/tasks/:id", async (req, res) => {
  const task = await taskService.findUnique(req.params.id);
  res.json({ data: task });
});

router.post("/tasks", async (req, res) => {
  const task = await taskService.create(req.body, req.user);
  res.status(201).json({
    message: "Data created successfully",
    data: { id: task.id },
  });
});

router.patch("/tasks/:id", async (req, res) => {
  const task = await taskService.update(req.params.id, req.body, req.user);
  res.status(200).json({
    message: "Data updated successfully",
    data: { id: task.id },
  });
});

router.patch("/tasks/upsert", async (req, res) => {
  const records = await taskService.upsert(req.body, req.user);
  res.status(200).json({
    message: "Data upserted successfully",
    data: records.map((record: any) => ({ id: record.id })),
  });
});

router.get("/tasks/:id/fund-comparison", async (req, res) => {
  const { showAll } = req.query;
  const comparison = await taskService.getFundComparison(
    req.params.id,
    showAll === "true"
  );
  res.json({ data: comparison });
});

router.get("/tasks/utilization", async (req, res) => {
  const { startDate, endDate, userId } = req.query;
  
  const filters: any = {};
  if (startDate && endDate) {
    filters.dateRange = {
      start: new Date(startDate as string),
      end: new Date(endDate as string),
    };
  }
  if (userId) {
    filters.userId = userId as string;
  }

  const data = await taskService.getUtilizationData(filters);
  res.json({ data });
});

export default router;