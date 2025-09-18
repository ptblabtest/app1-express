import multer from "multer";
import multerS3 from "multer-s3";
import crypto from "crypto";
import path from "path";
import { s3Client } from "@/lib/s3";

export const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.DO_SPACES_BUCKET!,
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req: any, file, cb) => {
      const urlParts = req.originalUrl.split("/");
      const modelPath = urlParts[2]?.split("?")[0];
      const uniqueSuffix = crypto.randomBytes(16).toString("hex");
      const ext = path.extname(file.originalname);
      const key = modelPath
        ? `${modelPath}/${Date.now()}-${uniqueSuffix}${ext}`
        : `${Date.now()}-${uniqueSuffix}${ext}`;
      cb(null, key);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});
