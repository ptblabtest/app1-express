import { Router } from "express";
import { expenseService } from "@/modules/services/ExpenseService";
import { costTypeService } from "../services/CostTypeService";
import { fundService } from "@/modules/services/FundService";
import { budgetService } from "@/modules/services/BudgetService";

const router = Router();

router.get("/cost-types", async (req, res) => {
  const costTypes = await costTypeService.findMany(req.query);
  res.json({
    data: costTypes,
    meta: { total: costTypes.length },
  });
});

router.get("/cost-types/:id", async (req, res) => {
  const costType = await costTypeService.findUnique(req.params.id);
  res.json({ data: costType });
});

router.post("/cost-types", async (req, res) => {
  const costType = await costTypeService.create(req.body, req.user);
  res.status(201).json({
    message: "Data created successfully",
    data: { id: costType.id },
  });
});

router.patch("/cost-types/:id", async (req, res) => {
  const costType = await costTypeService.update(
    req.params.id,
    req.body,
    req.user
  );
  res.status(200).json({
    message: "Data updated successfully",
    data: { id: costType.id },
  });
});

router.patch("/cost-types/upsert", async (req, res) => {
  const records = await costTypeService.upsert(req.body, req.user);
  res.status(200).json({
    message: "Data upserted successfully",
    data: records.map((record: any) => ({ id: record.id })),
  });
});

router.get("/expenses", async (req, res) => {
  const expenses = await expenseService.findMany(req.query);
  res.json({
    data: expenses,
    meta: { total: expenses.length },
  });
});

router.get("/expenses/:id", async (req, res) => {
  const expense = await expenseService.findUnique(req.params.id);
  res.json({ data: expense });
});

router.post("/expenses", async (req, res) => {
  const expense = await expenseService.create(req.body, req.user);
  res.status(201).json({
    message: "Data created successfully",
    data: { id: expense.id },
  });
});

router.patch("/expenses/:id", async (req, res) => {
  const expense = await expenseService.update(
    req.params.id,
    req.body,
    req.user
  );
  res.status(200).json({
    message: "Data updated successfully",
    data: { id: expense.id },
  });
});

router.patch("/expenses/upsert", async (req, res) => {
  const records = await expenseService.upsert(req.body, req.user);
  res.status(200).json({
    message: "Data upserted successfully",
    data: records.map((record: any) => ({ id: record.id })),
  });
});

router.post("/expenses/fix-missing-ids", async (req, res) => {
  await expenseService.fixMissingRelatedIds();
  res.json({ message: "Missing related IDs fixed successfully" });
});

router.get("/funds", async (req, res) => {
  const funds = await fundService.findMany(req.query);
  res.json({
    data: funds,
    meta: { total: funds.length },
  });
});

router.get("/funds/:id", async (req, res) => {
  const fund = await fundService.findUnique(req.params.id);
  res.json({ data: fund });
});

router.post("/funds", async (req, res) => {
  const fund = await fundService.create(req.body, req.user);
  res.status(201).json({
    message: "Data created successfully",
    data: { id: fund.id },
  });
});

router.patch("/funds/:id", async (req, res) => {
  const fund = await fundService.update(req.params.id, req.body, req.user);
  res.status(200).json({
    message: "Data updated successfully",
    data: { id: fund.id },
  });
});

router.get("/funds/:id/comparison", async (req, res) => {
  const { showAll } = req.query;
  const comparison = await fundService.getFundComparison(
    req.params.id,
    showAll === "true"
  );
  res.json({ data: comparison });
});

router.get("/budgets", async (req, res) => {
  const budgets = await budgetService.findMany(req.query);
  res.json({
    data: budgets,
    meta: { total: budgets.length },
  });
});

router.get("/budgets/:id", async (req, res) => {
  const budget = await budgetService.findUnique(req.params.id);
  res.json({ data: budget });
});

router.post("/budgets", async (req, res) => {
  const budget = await budgetService.create(req.body, req.user);
  res.status(201).json({
    message: "Data created successfully",
    data: { id: budget.id },
  });
});

router.patch("/budgets/:id", async (req, res) => {
  const budget = await budgetService.update(req.params.id, req.body, req.user);
  res.status(200).json({
    message: "Data updated successfully",
    data: { id: budget.id },
  });
});

export default router;

// const budgetRouter = Router();
// budgetRouter.get(
//   "/budgets/form/:id?",
//   requireAuth,
//   async (req: any, res: any) => {
//     try {
//       const formData = await budgetService.getForm(req.params.id);

//       if (!formData && req.params.id) {
//         return res.status(404).json({ message: "Budget not found" });
//       }

//       res.json({ data: formData });
//     } catch (error: any) {
//       res.status(500).json({ message: error.message });
//     }
//   }
// );

// budgetRouter.use(
//   routerFactory({
//     basePath: "/budgets",
//     service: budgetService,
//     routes: {
//       findMany: {},
//       findOne: {},
//       create: {},
//       update: {},
//     },
//   })
// );

// const costTypeRouter = Router();

// costTypeRouter.get("/cost-types", requireAuth, async (req: any, res: any) => {
//   try {
//     const formData = await costTypeService.findMany(req.query);

//     if (!formData && req.params.id) {
//       return res.status(404).json({ message: "Cost types not found" });
//     }

//     res.json({ data: formData });
//   } catch (error: any) {
//     res.status(500).json({ message: error.message });
//   }
// });

// costTypeRouter.use(
//   routerFactory({
//     basePath: "/cost-types",
//     service: costTypeService,
//     routes: {
//       findOne: {},
//       create: {},
//       update: {},
//     },
//   })
// );

// const expenseRouter = routerFactory({
//   basePath: "/expenses",
//   service: expenseService,
//   routes: {
//     findMany: {},
//     findOne: {},
//     create: {},
//     update: {},
//     upsert: {},
//   },

//   // router.patch(`${basePath}/review`, requireAuth, async (req: any, res: any) => {
//   //   const result = await service.review(req.body, req.user);
//   //   res.json(result);
//   // });

//   // router.patch(`${basePath}/assign-task`, requireAuth, async (req: any, res: any) => {
//   //   const result = await service.assignTask(req.user);
//   //   res.json(result);
//   // });
// });

// const fundRouter = Router();
// fundRouter.get("/funds/form/:id?", requireAuth, async (req: any, res: any) => {
//   try {
//     const { taskId } = req.query;
//     const formData = await fundService.getForm(req.params.id, taskId);
//     if (!formData && req.params.id) {
//       return res.status(404).json({ message: "Fund not found" });
//     }
//     res.json({ data: formData });
//   } catch (error: any) {
//     res.status(500).json({ message: error.message });
//   }
// });

// fundRouter.get(
//   "/funds/:id/budget-comparison",
//   requireAuth,
//   async (req: any, res: any) => {
//     try {
//       const record = await fundService.getFundComparison(req.params.id);
//       if (record) {
//         res.json({ data: record });
//       } else {
//         res.status(404).json({ message: `Data not found` });
//       }
//     } catch (error: any) {
//       res.status(500).json({ message: error.message });
//     }
//   }
// );

// fundRouter.use(
//   routerFactory({
//     basePath: "/funds",
//     service: fundService,
//     routes: {
//       findMany: {},
//       findOne: {},
//       create: {},
//       update: {},
//     },
//   })
// );

// export { budgetRouter, costTypeRouter, expenseRouter, fundRouter };
