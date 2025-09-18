import { Router } from "express";
import { eventService } from "@/modules/services/EventService";
import { noteService } from "@/modules/services/NoteService";

const router = Router();

router.get("/events", async (req, res) => {
  const { pipelineId, projectId, taskId, ...otherParams } = req.query;

  const where: any = {};

  if (pipelineId) where.pipelineId = pipelineId;
  if (projectId) where.projectId = projectId;
  if (taskId) where.taskId = taskId;

  const queryOptions = {
    where,
    orderBy: { updatedAt: "desc" },
    ...otherParams,
  };

  const events = await eventService.findMany(queryOptions);
  res.json({
    data: events,
    meta: { total: events.length },
  });
});

router.get("/events/:id", async (req, res) => {
  const event = await eventService.findUnique(req.params.id);
  res.json({ data: event });
});

router.post("/events", async (req, res) => {
  const event = await eventService.create(req.body, req.user);
  res.status(201).json({
    message: "Data created successfully",
    data: { id: event.id },
  });
});

router.patch("/events/:id", async (req, res) => {
  const event = await eventService.update(req.params.id, req.body, req.user);
  res.status(200).json({
    message: "Data updated successfully",
    data: { id: event.id },
  });
});

router.delete("/events/:id", async (req, res) => {
  await eventService.delete(req.params.id);
  res.json({ message: "Data deleted successfully" });
});

router.get("/notes", async (req, res) => {
  const {
    pipelineId,
    projectId,
    milestoneId,
    taskId,
    budgetId,
    fundId,
    expenseId,
    clientId,
    vendorId,
    ...otherParams
  } = req.query;

  const where: any = {};

  // Add filters for foreign keys
  if (pipelineId) where.pipelineId = pipelineId;
  if (projectId) where.projectId = projectId;
  if (milestoneId) where.milestoneId = milestoneId;
  if (taskId) where.taskId = taskId;
  if (budgetId) where.budgetId = budgetId;
  if (fundId) where.fundId = fundId;
  if (expenseId) where.expenseId = expenseId;
  if (clientId) where.clientId = clientId;
  if (vendorId) where.vendorId = vendorId;

  const queryOptions = {
    where,
    orderBy: { updatedAt: "desc" },
    ...otherParams,
  };

  const notes = await noteService.findMany(queryOptions);
  res.json({
    data: notes,
    meta: { total: notes.length },
  });
});

router.get("/notes/:id", async (req, res) => {
  const note = await noteService.findUnique(req.params.id);
  res.json({ data: note });
});

router.post("/notes", async (req, res) => {
  const note = await noteService.create(req.body, req.user);
  res.status(201).json({
    message: "Data created successfully",
    data: { id: note.id },
  });
});

router.patch("/notes/:id", async (req, res) => {
  const note = await noteService.update(req.params.id, req.body, req.user);
  res.status(200).json({
    message: "Data updated successfully",
    data: { id: note.id },
  });
});

router.delete("/notes/:id", async (req, res) => {
  await noteService.delete(req.params.id);
  res.json({ message: "Data deleted successfully" });
});

export default router;
