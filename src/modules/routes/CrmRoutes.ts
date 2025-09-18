import { Router } from "express";
import { leadService } from "@/modules/services/LeadService";
import { opportunityService } from "@/modules/services/OpportunityService";
import { quoteService } from "@/modules/services/QuoteService";
import { contractService } from "@/modules/services/ContractService";
import { pipelineService } from "@/modules/services/PipelineService";

const router = Router();

// Pipeline routes
router.get("/pipelines", async (req, res) => {
  const pipelines = await pipelineService.findMany(req.query);
  res.json(pipelines);
});

router.get("/pipelines/:id", async (req, res) => {
  const pipeline = await pipelineService.findUnique(req.params.id);
  res.json(pipeline);
});

router.post("/pipelines", async (req, res) => {
  const id = await pipelineService.create(req.body, req.user);
  res.status(201).json({ id });
});

router.patch("/pipelines/:id", async (req, res) => {
  const id = await pipelineService.update(req.params.id, req.body, req.user);
  res.json({ id });
});

// Lead routes
router.get("/leads", async (req, res) => {
  const leads = await leadService.findMany(req.query);
  res.json({
    data: leads,
    meta: { total: leads.length },
  });
});

router.get("/leads/:id", async (req, res) => {
  const lead = await leadService.findUnique(req.params.id);
  res.json({ data: lead });
});

router.patch("/leads/:id", async (req, res) => {
  const lead = await leadService.update(req.params.id, req.body, req.user);
  res.status(200).json({
    message: "Data updated successfully",
    data: { id: lead.id },
  });
});

// Opportunity routes
router.get("/opportunities", async (req, res) => {
  const opportunities = await opportunityService.findMany(req.query);
  res.json({
    data: opportunities,
    meta: { total: opportunities.length },
  });
});

router.get("/opportunities/:id", async (req, res) => {
  const opportunity = await opportunityService.findUnique(req.params.id);
  res.json({ data: opportunity });
});

// Quote routes
router.get("/quotes", async (req, res) => {
  const quotes = await quoteService.findMany(req.query);
  res.json({
    data: quotes,
    meta: { total: quotes.length },
  });
});

router.get("/quotes/:id", async (req, res) => {
  const quote = await quoteService.findUnique(req.params.id);
  res.json({ data: quote });
});

router.patch("/quotes/:id", async (req, res) => {
  const quote = await quoteService.update(req.params.id, req.body, req.user);
  res.status(200).json({
    message: "Data updated successfully",
    data: { id: quote.id },
  });
});

// Contract routes
router.get("/contracts", async (req, res) => {
  const contracts = await contractService.findMany(req.query);
  res.json({
    data: contracts,
    meta: { total: contracts.length },
  });
});

router.get("/contracts/:id", async (req, res) => {
  const contract = await contractService.findUnique(req.params.id);
  res.json({ data: contract });
});

export default router;
