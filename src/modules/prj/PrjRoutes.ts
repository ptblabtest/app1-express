import { routerFactory } from "@/utils/routerFactory";
import { requireAuth, requireRole } from "@/middlewares/auth";
import { projectService } from "./ProjectService";
import { taskService } from "@/modules/prj/TaskService";
import { milestoneService } from "@/modules/prj/MilestoneService";
import { Router } from "express";

const projectRouter = routerFactory({
  basePath: "/projects",
  service: projectService,
  routes: {
    findMany: {},
    findOne: {},
    create: {},
    update: {},
  },
});

projectRouter.get(
  "/projects/:id/scurves",
  requireAuth,
  async (req: any, res: any) => {
    try {
      const record = await projectService.getScurveData(req.params.id);
      if (record) {
        res.json({ data: record });
      } else {
        res.status(404).json({ message: `Data not found` });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

projectRouter.get(
  "/projects/:id/budget-comparison",
  requireAuth,
  async (req: any, res: any) => {
    try {
      const record = await projectService.getBudgetComparison(req.params.id);
      if (record) {
        res.json({ data: record });
      } else {
        res.status(404).json({ message: `Data not found` });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

projectRouter.get(
  "/projects/:id/gantt",
  requireAuth,
  async (req: any, res: any) => {
    try {
      const record = await projectService.getGanttData(req.params.id);
      if (record) {
        res.json({ data: record });
      } else {
        res.status(404).json({ message: `Data not found` });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

const milestoneRouter = routerFactory({
  basePath: "/milestones",
  service: milestoneService,
  routes: {
    findMany: {},
    findOne: {},
  },
});

const taskRouter = Router();

taskRouter.get(
  "/tasks/:id/budget-comparison",
  requireAuth,
  async (req: any, res: any) => {
    try {
      const record = await taskService.getFundComparison(req.params.id);
      if (record) {
        res.json({ data: record });
      } else {
        res.status(404).json({ message: `Data not found` });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

taskRouter.get(
  "/tasks/utilization",
  requireAuth,
  async (req: any, res: any) => {
    try {
      const filters: any = {};

      // Parse date range from query params
      if (req.query.startDate && req.query.endDate) {
        filters.dateRange = {
          start: new Date(req.query.startDate),
          end: new Date(req.query.endDate),
        };
      }

      // Parse userId from query params
      if (req.query.userId) {
        filters.userId = req.query.userId;
      }

      const data = await taskService.getUtilizationData(
        Object.keys(filters).length > 0 ? filters : undefined
      );

      res.json({ data });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);
taskRouter.use(
  routerFactory({
    basePath: "/tasks",
    service: taskService,
    routes: {
      findMany: {},
      findOne: {},
      create: {},
      upsert: {},
      update: {},
    },
  })
);



export { projectRouter, milestoneRouter, taskRouter };
