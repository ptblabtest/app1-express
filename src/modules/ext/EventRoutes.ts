import { eventService } from "@/modules/ext/ExtService";
import { Router } from "express";

const router = Router();

// GET all events
router.get("/", async (req, res) => {
  try {
    const events = await eventService.findMany(req.query);
    res.json(events);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET single event
router.get("/:id", async (req, res) => {
  try {
    const event = await eventService.findUnique(req.params.id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.json(event);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE new event
router.post("/", async (req, res) => {
  try {
    const event = await eventService.create(req.body, req.user);
    res.status(201).json({ id: event.id });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// UPDATE event
router.patch("/:id", async (req, res) => {
  try {
    const event = await eventService.update(req.params.id, req.body, req.user);
    res.json({ id: event.id });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE event
router.delete("/:id", async (req, res) => {
  try {
    const result = await eventService.delete(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
