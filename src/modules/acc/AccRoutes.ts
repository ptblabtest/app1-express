import { routerFactory } from "@/utils/routerFactory";
import { requireAuth, requireRole } from "@/middlewares/auth";
import { expenseService } from "./ExpenseService";
import { costTypeService } from "./CostTypeService";
import { fundService } from "./FundService";
import { budgetService } from "./BudgetService";
import { Router } from "express";

const budgetRouter = Router();
budgetRouter.get(
  "/budgets/form/:id?",
  requireAuth,
  async (req: any, res: any) => {
    try {
      const formData = await budgetService.getForm(req.params.id);

      if (!formData && req.params.id) {
        return res.status(404).json({ message: "Budget not found" });
      }

      res.json({ data: formData });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

budgetRouter.use(
  routerFactory({
    basePath: "/budgets",
    service: budgetService,
    routes: {
      findMany: {},
      findOne: {},
      create: {},
      update: {},
    },
  })
);

const costTypeRouter = Router();

costTypeRouter.get("/cost-types", requireAuth, async (req: any, res: any) => {
  try {
    const formData = await costTypeService.findMany(req.query);

    if (!formData && req.params.id) {
      return res.status(404).json({ message: "Cost types not found" });
    }

    res.json({ data: formData });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

costTypeRouter.use(
  routerFactory({
    basePath: "/cost-types",
    service: costTypeService,
    routes: {
      findOne: {},
      create: {},
      update: {},
    },
  })
);

const expenseRouter = routerFactory({
  basePath: "/expenses",
  service: expenseService,
  routes: {
    findMany: {},
    findOne: {},
    create: {},
    update: {},
    upsert: {},
  },

  // router.patch(`${basePath}/review`, requireAuth, async (req: any, res: any) => {
  //   const result = await service.review(req.body, req.user);
  //   res.json(result);
  // });

  // router.patch(`${basePath}/assign-task`, requireAuth, async (req: any, res: any) => {
  //   const result = await service.assignTask(req.user);
  //   res.json(result);
  // });
});

const fundRouter = Router();
fundRouter.get("/funds/form/:id?", requireAuth, async (req: any, res: any) => {
  try {
    const { taskId } = req.query;
    const formData = await fundService.getForm(req.params.id, taskId);
    if (!formData && req.params.id) {
      return res.status(404).json({ message: "Fund not found" });
    }
    res.json({ data: formData });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

fundRouter.get(
  "/funds/:id/budget-comparison",
  requireAuth,
  async (req: any, res: any) => {
    try {
      const record = await fundService.getFundComparison(req.params.id);
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

fundRouter.use(
  routerFactory({
    basePath: "/funds",
    service: fundService,
    routes: {
      findMany: {},
      findOne: {},
      create: {},
      update: {},
    },
  })
);

export { budgetRouter, costTypeRouter, expenseRouter, fundRouter };
