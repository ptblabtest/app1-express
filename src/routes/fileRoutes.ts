import { Router } from "express";
import { requireAuth } from "@/middlewares/auth";
import prisma from "@/lib/prisma";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { S3Client } from "@aws-sdk/client-s3";

const router = Router();

// Configure S3 client for DigitalOcean Spaces
const s3Client = new S3Client({
  endpoint: `https://${process.env.DO_SPACES_REGION}.digitaloceanspaces.com`,
  region: process.env.DO_SPACES_REGION,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY!,
    secretAccessKey: process.env.DO_SPACES_SECRET!,
  },
});

// Download file by ID
router.get("/:id/download", requireAuth, async (req: any, res: any) => {
  try {
    const fileId = req.params.id;

    // Get file from database
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        report: {
          select: {
            organizationId: true,
            createdById: true,
            categoryId: true,
          },
        },
      },
    });

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // Check permissions
    if (!(await checkFilePermissions(req.user, file, "view"))) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Get file from S3/Spaces
    const command = new GetObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET!,
      Key: file.key, // Using the S3 key stored in database
    });

    const response = await s3Client.send(command);
    
    // Set headers for download
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.key.split('/').pop()}"`
    );
    res.setHeader("Content-Type", response.ContentType || "application/octet-stream");
    res.setHeader("Content-Length", response.ContentLength || 0);

    // Stream the file to client
    const stream = response.Body as any;
    stream.pipe(res);

  } catch (error: any) {
    console.error("Download error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Preview file (opens in browser if supported)
router.get("/:id/preview", requireAuth, async (req: any, res: any) => {
  try {
    const fileId = req.params.id;

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        report: {
          select: {
            organizationId: true,
            categoryId: true,
          },
        },
      },
    });

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // Check permissions
    if (!(await checkFilePermissions(req.user, file, "view"))) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Get file from S3/Spaces
    const command = new GetObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET!,
      Key: file.key,
    });

    const response = await s3Client.send(command);

    // Set headers for inline viewing
    res.setHeader(
      "Content-Disposition", 
      `inline; filename="${file.key.split('/').pop()}"`
    );
    res.setHeader("Content-Type", response.ContentType || "application/octet-stream");

    const stream = response.Body as any;
    stream.pipe(res);

  } catch (error: any) {
    console.error("Preview error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Delete file
router.delete("/:id", requireAuth, async (req: any, res: any) => {
  try {
    const fileId = req.params.id;

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        report: {
          select: {
            createdById: true,
            organizationId: true,
            categoryId: true,
          },
        },
      },
    });

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // Check permissions
    if (!(await checkFilePermissions(req.user, file, "delete"))) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Additional check: only creator can delete (unless superadmin/manager)
    if (req.user.role.level > 2 && file.report?.createdById !== req.user.id) {
      return res.status(403).json({ message: "Only the creator can delete this file" });
    }

    // Delete from S3/Spaces
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET!,
      Key: file.key,
    });
    await s3Client.send(deleteCommand);

    // Delete from database
    await prisma.file.delete({
      where: { id: fileId },
    });

    res.status(200).json({ message: "File deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Helper function remains the same
const checkFilePermissions = async (user: any, file: any, action: string) => {
  // Your existing permission logic
  if (user.role.level <= 2) return true;
  if (user.role.level === 4 && action === "delete") return false;
  
  if (file.report) {
    if (user.role.level === 3 && file.report.organizationId !== user.organizationId) {
      return false;
    }
    
    if (file.report.categoryId) {
      const hasPermission = await prisma.userPermission.findFirst({
        where: {
          userId: user.id,
          permission: {
            resource: `report:category:${file.report.categoryId}`,
            action: action === "delete" ? "create" : "view",
          },
        },
      });
      return !!hasPermission;
    }
  }
  
  return true;
};

export default router;