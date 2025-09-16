import { prepareForView } from "./query/prepareForView";
import prisma from "../lib/prisma";
import { prepareData } from "../utils/mutation/prepareData";

export const serviceFactory = (model: string, options: any = {}) => {
  const service: any = {};
  const {
    operations = ["create", "update", "findMany", "findUnique", "delete"],
    skipValidation = false,
    schema = null,
  } = options;

  // For create operation
  if (operations.includes("create")) {
    service.create = async (body: any, user: any) => {
      const preparedData = await prepareData(
        schema,
        model,
        body,
        user,
        "create"
      );
      console.log(
        "CREATE - preparedData:",
        JSON.stringify(preparedData, null, 2)
      );

      const processedData = options.beforeCreate
        ? await options.beforeCreate(preparedData, user)
        : preparedData;
      console.log(
        "CREATE - processedData:",
        JSON.stringify(processedData, null, 2)
      );

      const validatedData = skipValidation
        ? processedData
        : await schema.parseAsync(processedData);
      console.log(
        "CREATE - validatedData:",
        JSON.stringify(validatedData, null, 2)
      );

      const record = await prisma[model].create({
        data: validatedData,
      });

      if (options.afterCreate) {
        console.log(
          "CREATE - before afterCreate hook, record:",
          JSON.stringify(record, null, 2)
        );
        await options.afterCreate(record, user);
        console.log("CREATE - afterCreate hook completed");
      }
      return record;
    };
  }

  // For update operation
  if (operations.includes("update")) {
    service.update = async (body: any, id: string, user: any) => {
      const preparedData = await prepareData(
        schema,
        model,
        body,
        user,
        "update"
      );
      console.log(
        "UPDATE - preparedData:",
        JSON.stringify(preparedData, null, 2)
      );

      const processedData = options.beforeUpdate
        ? await options.beforeUpdate(preparedData, id, user)
        : preparedData;
      console.log(
        "UPDATE - processedData:",
        JSON.stringify(processedData, null, 2)
      );

      // Validate after beforeUpdate hook
      const validatedData = skipValidation
        ? processedData
        : await schema.partial().parseAsync(processedData);
      console.log(
        "UPDATE - validatedData:",
        JSON.stringify(validatedData, null, 2)
      );

      const record = await prisma[model].update({
        where: { id },
        data: validatedData,
      });

      if (options.afterUpdate) {
        console.log(
          "UPDATE - before afterUpdate hook, record:",
          JSON.stringify(record, null, 2)
        );
        await options.afterUpdate(record, user);
        console.log("UPDATE - afterUpdate hook completed");
      }

      return record;
    };
  }

  if (operations.includes("findMany")) {
    service.findMany = async (queryParams?: any) => {
      const records = await prisma[model].findMany({
        ...queryParams,
        ...options.queryOptions,
      });

      const preparedRecords = records.map((record: any) =>
        prepareForView(record)
      );

      if (options.transformData) {
        return await Promise.all(preparedRecords.map(options.transformData));
      }
      return preparedRecords;
    };
  }

  if (operations.includes("findUnique")) {
    service.findUnique = async (id: string) => {
      const record = await prisma[model].findUnique({
        where: { id },
        ...options.queryOptions,
      });

      if (!record) return null;

      const preparedRecord = prepareForView(record);

      if (options.transformData) {
        return options.transformData(preparedRecord);
      }
      return preparedRecord;
    };
  }

  if (operations.includes("delete")) {
    service.delete = async (id: string) => {
      // Check if record exists first
      const existingRecord = await prisma[model].findUnique({
        where: { id },
      });

      if (!existingRecord) {
        throw new Error(`${model} with id ${id} not found`);
      }

      if (options.beforeDelete) {
        await options.beforeDelete(id);
      }

      const record = await prisma[model].delete({
        where: { id },
      });

      if (options.afterDelete) {
        await options.afterDelete(record);
      }

      return record;
    };
  }

  if (operations.includes("upsert")) {
    service.upsert = async (body: any, user: any) => {
      const items = body.data;
      const results = [];
      const tempIdMapping: Record<string, string> = {}; // Map tempId to real id

      for (let index = 0; index < items.length; index++) {
        const item = { ...items[index] };

        // Store tempId if present and remove it from the item
        const tempId = item.tempId;
        if (tempId) {
          delete item.tempId;
        }

        // Only add order if it's in queryOptions.select
        if (options.queryOptions?.select?.order) {
          item.order = index + 1;
        }

        // Handle parent-child relationships using tempId
        if (item.parentId && tempIdMapping[item.parentId]) {
          item.parentId = tempIdMapping[item.parentId];
        }

        let result;
        if (item.id) {
          // Update existing record
          result = await service.update(item, item.id, user);
        } else {
          // Create new record
          result = await service.create(item, user);

          // Map tempId to the newly created real id
          if (tempId && result.id) {
            tempIdMapping[tempId] = result.id;
          }
        }

        results.push(result);
      }

      return results;
    };
  }

  return service;
};
