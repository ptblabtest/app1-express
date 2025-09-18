import express from "express";
import argon2 from "argon2";
import passport from "@/auth/passport";
import prisma from "@/lib/prisma";
import { AuthUser } from "@/types/auth";
import { requireAuth, requireRole } from "@/auth/authMiddleware";

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

      req.login(user, async (err) => {
        if (err) {
          console.error("Login session error:", {
            error: err.message || err,
            username: req.body.username,
            timestamp: new Date().toISOString(),
          });
          return next(err);
        }

        // Get user's current password hash from database
        const userWithPassword = await prisma.user.findUnique({
          where: { id: user.id },
          select: { password: true },
        });

        // Check if current password is the default password "12345678"
        const isDefaultPassword = userWithPassword
          ? await argon2.verify(userWithPassword.password, "12345678")
          : false;

        // Return user data that Next.js can use
        res.json({
          message: "Login successful",
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
          },
          changePassword: isDefaultPassword,
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

  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      username: true,
      displayName: true,
      status: true,
      role: {
        select: {
          id: true,
          name: true,
          level: true,
        },
      },
    },
  });

  res.json(userData);
});

router.post("/register", async (req, res) => {
  const { username, password, displayName, roleId, status } =
    req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters long" });
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
      displayName: displayName || null,
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      status: true,
      role: true,
    },
  });

  res.status(201).json({
    message: `User created successfully${
      (status || "INACTIVE") === "INACTIVE"
        ? ". Please wait for activation."
        : ""
    }`,
    user,
  });
});

router.patch("/update/:id", requireAuth, requireRole(2), async (req, res) => {
  const { id } = req.params;
  const { username, displayName, roleId, status } = req.body;

  if (username) {
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser && existingUser.id !== id) {
      return res.status(400).json({ message: "Username already exists" });
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: id },
    data: {
      username: username || undefined,
      displayName: displayName || undefined,
      status: status || undefined,
      roleId: roleId !== undefined ? roleId : undefined,
    },
    select: {
      id: true,
      username: true,
      status: true,
      roleId: true,
    },
  });

  res.json({
    message: "User updated successfully",
    user: updatedUser,
  });
});

router.patch("/change-password", requireAuth, async (req, res) => {
  const user = req.user as any;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Current password and new password are required" });
  }

  // Check minimum length
  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters long" });
  }

  // Check for easy/common passwords
  const easyPasswords = ["12345678", "password", "123456", "qwerty", "admin"];
  if (easyPasswords.includes(newPassword.toLowerCase())) {
    return res.status(400).json({
      message: "Password is too common. Please choose a stronger password",
    });
  }

  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      password: true,
    },
  });

  if (!userData) {
    return res.status(404).json({ message: "User not found" });
  }

  const isCurrentPasswordValid = await argon2.verify(
    userData.password,
    currentPassword
  );

  if (!isCurrentPasswordValid) {
    return res.status(400).json({ message: "Current password is incorrect" });
  }

  const hashedNewPassword = await argon2.hash(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedNewPassword,
    },
  });

  res.json({
    message: "Password changed successfully",
  });
});

// router.delete("/delete/:id", requireAuth, requireRole(2), async (req, res) => {
//   const { id } = req.params;
//   const currentUser = req.user as any;

//   // Prevent self-deletion
//   if (currentUser.id === id) {
//     return res.status(400).json({ message: "Cannot delete your own account" });
//   }

//   try {
//     const userToDelete = await prisma.user.findUnique({
//       where: { id },
//       select: { id: true, username: true },
//     });

//     if (!userToDelete) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Delete in transaction to handle foreign key constraints
//     await prisma.$transaction(async (prisma: any) => {
//       // Delete profile first if it exists
//       await prisma.profile.deleteMany({
//         where: { userId: id },
//       });

//       // Then delete the user
//       await prisma.user.delete({
//         where: { id },
//       });
//     });

//     res.json({
//       message: "User deleted successfully",
//       deletedUser: userToDelete,
//     });
//   } catch (error) {
//     console.error("Delete user error:", error);
//     res.status(500).json({ message: "Failed to delete user" });
//   }
// });

export default router;
