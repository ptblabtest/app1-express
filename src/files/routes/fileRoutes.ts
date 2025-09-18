import { Router } from "express";
import { requireAuth } from "@/auth/authMiddleware";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3";

const router = Router();

router.get(
  "/:id/download",
  requireAuth,
  async (req: any, res: any) => {
    try {
      const file = req.file;
      
      const command = new GetObjectCommand({
        Bucket: process.env.DO_SPACES_BUCKET!,
        Key: file.key,
      });

      const response = await s3Client.send(command);

      // Set headers for download
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${file.key.split("/").pop()}"`
      );
      res.setHeader(
        "Content-Type",
        response.ContentType || "application/octet-stream"
      );
      res.setHeader("Content-Length", response.ContentLength || 0);

      // Stream the file to client
      const stream = response.Body as any;
      stream.pipe(res);
    } catch (error: any) {
      console.error("Download error:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;
