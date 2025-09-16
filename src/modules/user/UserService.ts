import prisma from "../../lib/prisma";
import { prepareForView } from "../../utils/query/prepareForView";

const USER_SELECT = {
  id: true,
  username: true,
  createdAt: true,
  updatedAt: true,
  role: {
    select: {
      id: true,
      name: true,
    },
  },
  organization: true,
  status: true,
  profile: {
    select: {
      id: true,
      name: true,
      joinDate: true,
      createdAt: true,
      updatedAt: true,
    },
  },
};

const transformUser = (user: any) => {
  const prepared = prepareForView(user);
  return {
    ...prepared,
    roleName: prepared.role?.name || null,
    organizationName: prepared.organization?.name || null,
    roleId: prepared.role?.id || null,
    profileName: prepared.profile?.name || null,
    joinDate: prepared.profile?.joinDate || null,
  };
};

export const userService = {
  findMany: async (queryParams?: any) => {
    const users = await prisma.user.findMany({
      ...queryParams,
      select: USER_SELECT,
    });

    return users.map(transformUser);
  },
  findUnique: async (id: string) => {
    const user = await prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
    return user ? transformUser(user) : null;
  },
  getForm: async (id?: string) => {
    if (!id) throw new Error("User ID is required");

    const user = await prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });

    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      status: user.status,
      roleId: user.role?.id || null,
      profileName: user.profile?.name || "",
      joinDate: user.profile?.joinDate
        ? new Date(user.profile.joinDate).toISOString().split("T")[0]
        : "",
    };
  },
};
