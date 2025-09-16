import { organizationService } from "@/modules/org/OrgService";
import { Router } from "express";

const router = Router();

// GET all organizations
router.get("/", async (req, res) => {
  const queryParams: any = {};

  // Handle name query
  if (req.query.name) {
    queryParams.where = {
      name: { contains: req.query.name },
    };
  }

  const organizations = await organizationService.findMany(queryParams);
  res.json(organizations);
});

// GET single organization
router.get("/:id", async (req, res) => {
  const organization = await organizationService.findUnique(req.params.id);
  if (!organization) {
    return res.status(404).json({ error: "Organization not found" });
  }
  res.json(organization);
});

// POST create organization
router.post("/", async (req, res) => {
  const organization = await organizationService.create(req.body);
  res.status(201).json(organization);
});

// PUT update organization
router.put("/:id", async (req, res) => {
  const organization = await organizationService.update(
    req.params.id,
    req.body
  );
  res.json(organization);
});

export default router;
