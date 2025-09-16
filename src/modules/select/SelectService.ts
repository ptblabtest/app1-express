import { selectConfig } from "@/config/selectConfig";
import prisma from "../../lib/prisma";

export class SelectService {
  static async fetchSelectOptions(key: string, query: any): Promise<any[]> {
    const config = selectConfig[key];
    const {
      service,
      model,
      keyFilter,
      where = {},
      mapToOption,
      select,
    } = config;

    try {
      let data: any[];

      if (service) {
        const filter: any = { where: { ...where } };
        if (keyFilter && query[keyFilter]) {
          filter.where[keyFilter] = query[keyFilter];
        }
        data = await service.findMany(filter);
      } else if (model) {
        const filter: any = { ...where };
        if (keyFilter && query[keyFilter]) {
          filter[keyFilter] = query[keyFilter];
        }
        data = await (prisma as any)[model].findMany({
          where: filter,
          ...(select && { select }),
        });
      } else {
        throw new Error(`No service or model defined for key: ${key}`);
      }

      return data.map(mapToOption);
    } catch (error: any) {
      console.error(
        `[SelectService] Error fetching select options for key ${key}:`,
        error.message
      );
      throw error;
    }
  }

  static async createSelectOption(
    key: string,
    body: any,
    user: any
  ): Promise<any> {
    const config = selectConfig[key];

    if (!config) {
      console.error(`[SelectService] Unsupported select key: ${key}`);
      throw new Error(`Unsupported select key: ${key}`);
    }

    if (!config.createMapping) {
      throw new Error(`Creating new options is not allowed for: ${key}`);
    }

    const { createMapping, where = {}, service, model } = config;

    try {
      const createData: any = {
        ...createMapping(body.value),
        ...where,
        ...(body.createdById && { createdById: body.createdById }),
        ...(body.updatedById && { updatedById: body.updatedById }),
      };

      let created: any;

      if (service) {
        created = await service.create(createData, user);
      } else if (model) {
        created = await (prisma as any)[model].create({
          data: createData,
        });
      } else {
        throw new Error(`No service or model defined for key: ${key}`);
      }

      return config.mapToOption(created);
    } catch (error: any) {
      console.error(
        `[SelectService] Error creating option for key ${key}:`,
        error.message
      );
      throw error;
    }
  }
}
