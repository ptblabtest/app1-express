import prisma from "../../lib/prisma";

export const userPermissionService = {
  findByUserId: async (userId: string) => {
    const userPermissions = await prisma.userPermission.findMany({
      where: { userId },
      select: {
        permissionId: true,
      },
    });

    return {
      userId,
      permissionIds: userPermissions.map((up: any) => up.permissionId),
    };
  },
  bulkReplace: async (userId: string, permissionIds: string[]) => {
    // Validate that all permissions exist
    const existingPermissions = await prisma.permission.findMany({
      where: {
        id: {
          in: permissionIds,
        },
      },
      select: { id: true },
    });

    if (existingPermissions.length !== permissionIds.length) {
      throw new Error("One or more permission IDs are invalid");
    }

    // Get count before
    const beforeCount = await prisma.userPermission.count({
      where: { userId },
    });

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx: any) => {
      // Delete all existing permissions for the user
      await tx.userPermission.deleteMany({
        where: { userId },
      });

      // Create new permissions
      if (permissionIds.length > 0) {
        await tx.userPermission.createMany({
          data: permissionIds.map((permissionId) => ({
            userId,
            permissionId,
          })),
        });
      }
    });

    return {
      success: true,
      beforeCount,
      afterCount: permissionIds.length,
    };
  },
};
