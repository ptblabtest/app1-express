// import ExcelJS from "exceljs";
// import { getDMMF } from "@prisma/internals";
// import { readFileSync } from "fs";
// import path from "path";
// import { Request } from "express";
// import { modelConfig } from "@/features/modules/config";
// import { BaseService } from "@/features/modules/BaseService";

// let cachedDMMF: Awaited<ReturnType<typeof getDMMF>> | null = null;

// type ExcelFieldDef = string | { field: string; label?: string };

// function normalizeExcelFields(fields: ExcelFieldDef[]): { field: string; label: string }[] {
//   return fields.map((item) =>
//     typeof item === "string"
//       ? { field: item, label: item }
//       : { field: item.field, label: item.label ?? item.field }
//   );
// }

// async function getExcelFieldDefs(
//   modelName: string,
//   mode: "export" | "import" | "template",
//   config?: any
// ): Promise<{ field: string; label: string }[]> {
//   const rawFields = config?.excelConfig?.[0]?.[mode];
//   if (Array.isArray(rawFields)) return normalizeExcelFields(rawFields);

//   if (!cachedDMMF) {
//     const schemaPath = path.join(process.cwd(), "prisma/schema.prisma");
//     const schema = readFileSync(schemaPath, "utf-8");
//     cachedDMMF = await getDMMF({ datamodel: schema });
//   }

//   const model = cachedDMMF.datamodel.models.find((m) => m.name === modelName);
//   if (!model) throw new Error(`Model ${modelName} not found`);

//   const exclude = ["createdAt", "updatedAt", "createdById", "updatedById"];
//   return model.fields
//     .filter((f) => f.kind === "scalar" && !f.isList && !exclude.includes(f.name))
//     .map((f) => ({ field: f.name, label: f.name }));
// }

// export class ExcelService {
//   private getModelConfig(entity: string) {
//     const configEntry = Object.values(modelConfig).find((cfg: any) => {
//       return entity.toLowerCase() === cfg.model.toLowerCase() + "s";
//     });

//     if (!configEntry) {
//       throw new Error(`Unknown entity: ${entity}`);
//     }

//     return {
//       modelName: configEntry.model,
//       config: configEntry,
//     };
//   }

//   async getExportData(entity: string) {
//     const { modelName, config } = this.getModelConfig(entity);
//     const service = new BaseService(modelName, config);

//     const allRows = await service.findAll({}, "export");
//     const fieldDefs = await getExcelFieldDefs(modelName, "export", config);

//     const rows = allRows.map((row) => {
//       const output: any = {};
//       fieldDefs.forEach(({ field }) => {
//         output[field] = row[field];
//       });
//       return output;
//     });

//     return {
//       modelName,
//       headers: fieldDefs.map((f) => f.label),
//       fields: fieldDefs.map((f) => f.field),
//       rows,
//     };
//   }

//   async importFromExcel(entity: string, req: Request, file: Express.Multer.File) {
//     const { modelName, config } = this.getModelConfig(entity);
//     const service = new BaseService(modelName, config);

//     const workbook = new ExcelJS.Workbook();
//     await workbook.xlsx.load(file.buffer);

//     const worksheet = workbook.worksheets[0];
//     const [headerRow, ...dataRows] = worksheet.getSheetValues().slice(1); // skip null row 0

//     const headers = (headerRow as any[]).slice(1).map((cell) =>
//       typeof cell === "string" ? cell.trim() : String(cell).trim()
//     );

//     const fieldDefs = await getExcelFieldDefs(modelName, "import", config);
//     const fieldMap: Record<string, string> = {};
//     fieldDefs.forEach(({ field, label }) => {
//       fieldMap[label] = field;
//     });

//     const data = dataRows.map((row) => {
//       const obj: any = {};
//       headers.forEach((label, index) => {
//         const fieldName = fieldMap[label];
//         if (fieldName) {
//           obj[fieldName] = row[index + 1]; // 1-indexed
//         }
//       });
//       return obj;
//     });

//     const result = await service.bulkUpdate(data, req);
//     return result;
//   }

//   async generateTemplate(entity: string) {
//     const { modelName, config } = this.getModelConfig(entity);
//     const fieldDefs = await getExcelFieldDefs(modelName, "template", config);

//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet(`${modelName}_Template`);
//     worksheet.addRow(fieldDefs.map((f) => f.label));

//     return workbook;
//   }
// }
