// import { Request, Response, NextFunction } from "express";
// import ExcelJS from "exceljs";
// import { ExcelService } from "@/features/_extensions/excel/ExcelService";

// const excelService = new ExcelService();

// export class ExcelController {
//   async exportToExcel(req: Request, res: Response, next: NextFunction) {
//     try {
//       const { entity } = req.params;
//       const { modelName, rows } = await excelService.getExportData(entity);

//       const workbook = new ExcelJS.Workbook();
//       const worksheet = workbook.addWorksheet(modelName);

//       if (rows.length === 0) {
//         worksheet.addRow(["No data available"]);
//       } else {
//         const columns = Object.keys(rows[0]);
//         worksheet.addRow(columns); // Header
//         rows.forEach((row :any) => worksheet.addRow(columns.map((col) => row[col])));
//       }

//       res.setHeader(
//         "Content-Type",
//         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//       );
//       res.setHeader(
//         "Content-Disposition",
//         `attachment; filename=${modelName}_export.xlsx`
//       );

//       await workbook.xlsx.write(res);
//       res.end();
//     } catch (err) {
//       next(err);
//     }
//   }

//   async importFromExcel(req: Request, res: Response, next: NextFunction) {
//     try {
//       const { entity } = req.params;
//       const file = req.file;

//       if (!file) return res.status(400).json({ message: "No file uploaded" });

//       const result = await excelService.importFromExcel(entity, req, file);
//       res.json({ message: "Import successful", result });
//     } catch (err) {
//       next(err);
//     }
//   }

//   async downloadTemplate(req: Request, res: Response, next: NextFunction) {
//     try {
//       const { entity } = req.params;
//       const workbook = await excelService.generateTemplate(entity);
  
//       res.setHeader(
//         "Content-Type",
//         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//       );
//       res.setHeader(
//         "Content-Disposition",
//         `attachment; filename=${entity}_template.xlsx`
//       );
  
//       await workbook.xlsx.write(res);
//       res.end();
//     } catch (err) {
//       next(err);
//     }
//   }
  
// }


// router.get("/export/:entity", excelController.exportToExcel.bind(excelController));
// router.post("/import/:entity", requireAuth, upload.single("file"), excelController.importFromExcel.bind(excelController));
// router.get("/export-template/:entity", excelController.downloadTemplate.bind(excelController));
