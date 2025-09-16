import { Router } from "express";
import { reportService } from "./ReportService";
import { upload } from "@/config/multer";
import { saveFilesToDatabase } from "@/middlewares/files";

const router = Router();

// GET all reports
router.get("/", async (req: any, res: any) => {
  const reports = await reportService.findMany(req.query, req.user);
  res.json(reports);
});

// GET single report
router.get("/:id", async (req: any, res: any) => {
  const report = await reportService.findUnique(req.params.id, req.user);
  if (!report) {
    return res.status(404).json({ error: "Report not found" });
  }
  res.json(report);
});

// POST create report with file
router.post(
  "/",
  upload.single("file"),
  saveFilesToDatabase("reportId"),
  async (req: any, res: any) => {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: "File is required" });
    }
    
    // Temporarily convert single file to array for middleware
    req.files = [req.file];
    
    const report = await reportService.create(req.body, req.user);
    
    // Save file to database
    const files = await req.saveFiles(report.id);
    
    res.status(201).json({ ...report, files });
  }
);

// POST create multiple reports with files
router.post(
  "/bulk",
  upload.array("files"),
  saveFilesToDatabase("reportId"),
  async (req: any, res: any) => {
    const reportsData = JSON.parse(req.body.reports);
    
    if (!req.files || req.files.length !== reportsData.length) {
      return res.status(400).json({
        error: `Number of files (${req.files?.length || 0}) must match number of reports (${reportsData.length})`,
      });
    }
    
    const results = [];
    const originalFiles = [...req.files];
    
    for (let i = 0; i < reportsData.length; i++) {
      const report = await reportService.create(reportsData[i], req.user);
      
      // Set files to single file for this iteration
      req.files = [originalFiles[i]];
      const files = await req.saveFiles(report.id);
      
      results.push({ ...report, files });
    }
    
    res.status(201).json(results);
  }
);

export default router;