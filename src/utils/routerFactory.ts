import { requireAuth } from "../middlewares/auth";
import { Router } from "express";

export function routerFactory(config: any) {
  const router = Router();
  const {
    basePath,
    service,
    middleware = [requireAuth],
    routes = {
      findMany: true,
      findOne: true,
      create: true,
      update: true,
      delete: false,
      upsert: false,
    },
  } = config;

  // Helper to get middleware for a route
  const getMiddleware = (route: any) => {
    if (!route.middleware) return [...middleware];
    return [...middleware, ...route.middleware];
  };

  // Add this after the update route block
  if (routes.upsert) {
    router.patch(
      `${basePath}/upsert`,
      ...getMiddleware(routes.upsert),
      async (req: any, res: any) => {
        try {
          const records = await service.upsert(req.body, req.user);
          res.status(200).json({
            message: `Data upserted successfully`,
            data: records.map((record: any) => ({ id: record.id })),
          });
        } catch (error: any) {
          // Handle Zod validation errors
          if (error.name === "ZodError") {
            return res.status(400).json({
              message: "Validation failed",
              errors: error.errors.map((e: any) => ({
                field: e.path.join("."),
                message: e.message,
              })),
            });
          }
          // Handle other errors
          res.status(500).json({ message: error.message });
        }
      }
    );
  }

  // Create routes
  if (routes.findMany) {
    router.get(
      basePath,
      ...getMiddleware(routes.findMany),
      async (req, res) => {
        try {
          const { mode, ...queryParams } = req.query;
          const records = await service.findMany(queryParams);
          res.json({
            data: records,
            meta: { total: records.length },
          });
        } catch (error: any) {
          res.status(500).json({ message: error.message });
        }
      }
    );
  }

  if (routes.findOne) {
    router.get(
      `${basePath}/:id`,
      ...getMiddleware(routes.findOne),
      async (req, res) => {
        try {
          const record = await service.findUnique(req.params.id);
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
  }

  if (routes.create) {
    router.post(basePath, ...getMiddleware(routes.create), async (req, res) => {
      try {
        const record = await service.create(req.body, req.user);
        res.status(201).json({
          message: `Data created successfully`,
          data: { id: record.id },
        });
      } catch (error: any) {
        // Handle Zod validation errors
        if (error.name === "ZodError") {
          return res.status(400).json({
            message: "Validation failed",
            errors: error.errors.map((e: any) => ({
              field: e.path.join("."),
              message: e.message,
            })),
          });
        }

        // Handle other errors
        res.status(500).json({ message: error.message });
      }
    });
  }

  if (routes.update) {
    router.patch(
      `${basePath}/:id`,
      ...getMiddleware(routes.update),
      async (req, res) => {
        try {
          const record = await service.update(
            req.body,
            req.params.id,
            req.user
          );
          res.status(200).json({
            message: `Data updated successfully`,
            data: { id: record.id },
          });
        } catch (error: any) {
          // Handle Zod validation errors
          if (error.name === "ZodError") {
            return res.status(400).json({
              message: "Validation failed",
              errors: error.errors.map((e: any) => ({
                field: e.path.join("."),
                message: e.message,
              })),
            });
          }

          // Handle other errors
          res.status(500).json({ message: error.message });
        }
      }
    );
  }

  return router;
}
