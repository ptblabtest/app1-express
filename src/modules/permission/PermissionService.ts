import prisma from "../../lib/prisma";
import { serviceFactory } from "../../utils/serviceFactory";

export const permissionService = serviceFactory("permission", {
  operations: ["create", "findMany", "findUnique", "delete", "update", "upsert"],
  queryOptions: {
    select: {
      id: true,
      name: true,
      resource: true,
      action: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      users: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              username: true,
            }
          }
        }
      },
      dept: {
        select: {
          id: true,
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            }
          }
        }
      }
    }
  },
  transformData: (result: any) => {
    return {
      ...result,
      assignedUsers: result.users?.map((u: any) => ({
        id: u.user.id,
        username: u.user.username,
      })) || [],
      assignedDepartments: result.dept?.map((d: any) => ({
        id: d.department.id,
        name: d.department.name,
        code: d.department.code,
      })) || [],
      // Clean up original nested data
      users: undefined,
      dept: undefined,
    };
  },
  beforeCreate: async (data: any, user: any) => {
    // Ensure unique permission name
    if (!data.name && data.resource && data.action) {
      data.name = `${data.resource}.${data.action}`;
    }
    return data;
  },
  beforeUpdate: async (data: any, id: string, user: any) => {
    // Update name if resource or action changes
    if ((data.resource || data.action) && !data.name) {
      const existing = await prisma.permission.findUnique({ 
        where: { id },
        select: { resource: true, action: true }
      });
      
      data.name = `${data.resource || existing?.resource}.${data.action || existing?.action}`;
    }
    return data;
  }
});