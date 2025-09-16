import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";
import crypto from "crypto";
import path from "path";

// Configure S3 client for DigitalOcean Spaces
const s3Client = new S3Client({
  endpoint: `https://${process.env.DO_SPACES_REGION}.digitaloceanspaces.com`,
  region: process.env.DO_SPACES_REGION, // e.g., "sgp1"
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY!,
    secretAccessKey: process.env.DO_SPACES_SECRET!,
  },
});

const s3Storage = multerS3({
  s3: s3Client,
  bucket: process.env.DO_SPACES_BUCKET!, // Your bucket name
  acl: "public-read", // or 'private' if you want controlled access
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
});

export const upload = multer({
  storage: s3Storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});
