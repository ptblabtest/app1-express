import { Router } from "express";
import { createCategoryPermissions, getCategoryLevel, reportCategoryService } from "./ReportCategoryService";
import prisma from "@/lib/prisma";

const router = Router();

// GET all categories
router.get("/", async (req: any, res: any) => {
  const categories = await reportCategoryService.findMany(req.query, req.user);
  res.json(categories);
});

// POST create category
router.post("/", async (req: any, res: any) => {
  const category = await reportCategoryService.create(req.body, req.user);
  res.status(201).json(category);
});

// PATCH update category
router.patch("/:id", async (req: any, res: any) => {
  const category = await reportCategoryService.update(
    req.params.id,
    req.body,
    req.user
  );
  res.json(category);
});

// DELETE category
router.delete("/:id", async (req: any, res: any) => {
  await reportCategoryService.delete(req.params.id);
  res.status(204).send();
});

// Add to ReportCategoryRoutes.ts temporarily
router.post("/sync-permissions", async (req: any, res: any) => {
  const allCategories = await prisma.reportCategory.findMany({
    select: { id: true, name: true },
  });

  let created = 0;
  for (const category of allCategories) {
    const level = await getCategoryLevel(category.id);
    if (level === 3) {
      // Check if permissions exist
      const exists = await prisma.permission.findFirst({
        where: { resource: `report:category:${category.id}` },
      });

      if (!exists) {
        await createCategoryPermissions(category.id, category.name);
        created += 4;
      }
    }
  }

  res.json({ message: `Created ${created} permissions` });
});

export default router;
