import express from "express";
import argon2 from "argon2";
import passport from "@/auth/passport";
import prisma from "@/lib/prisma";
import { AuthUser } from "@/types/auth";
import { requireAuth } from "@/middlewares/auth";

const router = express.Router();

router.post("/login", (req, res, next) => {
  // Console log login attempt details
  console.log("Login attempt:", {
    username: req.body.username,
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  passport.authenticate(
    "local",
    (err: any, user: AuthUser | false, info: { message?: string }) => {
      if (err) {
        // Console log authentication errors
        console.error("Login authentication error:", {
          error: err.message || err,
          username: req.body.username,
          timestamp: new Date().toISOString(),
        });
        return next(err);
      }

      if (!user) {
        // Console log failed login attempts
        console.error("Login failed:", {
          reason: info.message || "Login failed",
          username: req.body.username,
          timestamp: new Date().toISOString(),
        });
        return res.status(401).json({
          message: info.message || "Login failed",
        });
      }

      req.login(user, (err) => {
        if (err) {
          console.error("Login session error:", {
            error: err.message || err,
            username: req.body.username,
            timestamp: new Date().toISOString(),
          });
          return next(err);
        }

        // Return user data that Next.js can use
        res.json({
          message: "Login successful",
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            organization: user.organization,
          },
        });
      });
    }
  )(req, res, next);
});

router.post("/logout", requireAuth, (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Session destroy failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logout successful" });
    });
  });
});

router.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = req.user as any;

  // Return full user object, not just ID
  res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    organization: user.organization,
    status: user.status,
  });
});

router.post("/register", async (req, res) => {
  const { username, password, profileName, roleId, organizationId, status } =
    req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Validate status if provided
  if (status && !["ACTIVE", "INACTIVE"].includes(status)) {
    return res
      .status(400)
      .json({ message: "Invalid status. Must be ACTIVE or INACTIVE" });
  }

  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashedPassword = await argon2.hash(password);

  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      status: status || "INACTIVE",
      roleId: roleId || null,
      organizationId: organizationId || null,
      profile: profileName
        ? {
            create: {
              name: profileName,
              joinDate: new Date(),
            },
          }
        : undefined,
    },
    select: {
      id: true,
      username: true,
      status: true,
    },
  });

  res.status(201).json({
    message: `User created successfully${
      status === "ACTIVE" ? "" : ". Please wait for activation."
    }`,
    user,
  });
});

router.patch("/update/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { username, password, profileName, roleId, organizationId, status } =
    req.body;

  try {
    const updateData: any = {};

    if (username) updateData.username = username;
    if (password) updateData.password = await argon2.hash(password);
    if (roleId !== undefined) updateData.roleId = roleId;
    if (organizationId !== undefined)
      updateData.organizationId = organizationId;
    if (status) updateData.status = status;

    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: updateData,
      select: {
        id: true,
        username: true,
        status: true,
        roleId: true,
        organizationId: true,
      },
    });

    res.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(500).json({ message: "Failed to update user" });
  }
});

export default router;
