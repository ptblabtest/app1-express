import { Router } from "express";
import prisma from "@/lib/prisma";
import { requireRole } from "@/auth/authMiddleware";
import { prepareForView } from "@/utils/query/prepareForView";

const router = Router();

const USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  role: {
    select: {
      id: true,
      name: true,
      level: true,
    },
  },
};

const transformUser = (user: any) => {
  const prepared = prepareForView(user);
  return {
    ...prepared,
  };
};

router.get("/", requireRole(2), async (req, res) => {
  const queryParams: any = {
    where: {
      username: {
        not: {
          contains: "superadmin",
        },
      },
      AND: {
        username: {
          not: {
            contains: "test",
          },
        },
      },
    },
    orderBy: [
      {
        role: {
          level: "asc",
        },
      },
      {
        username: "asc",
      },
    ],
  };

  if (req.query.status) {
    queryParams.where.status = req.query.status;
  }

  const users = await prisma.user.findMany({
    ...queryParams,
    select: USER_SELECT,
  });

  res.json(users.map(transformUser));
});

router.get("/:id", requireRole(2), async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: USER_SELECT,
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(transformUser(user));
});

router.patch("/profile", async (req, res) => {
  const userId = req.user?.id;

  // Build update object
  const { username, profileName } = req.body;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(username !== undefined && { username }),
      ...(profileName !== undefined && {
        profile: {
          update: {
            name: profileName,
          },
        },
      }),
    },
    select: USER_SELECT,
  });

  res.json(transformUser(updatedUser));
});

export default router;
