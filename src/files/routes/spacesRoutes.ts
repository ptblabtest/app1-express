import { Router } from 'express';
import { 
  ListBucketsCommand, 
  ListObjectsV2Command 
} from '@aws-sdk/client-s3';
import { s3Client } from '@/lib/s3';

const router = Router();

// GET /api/spaces-test/connection
router.get('/connection', async (req, res) => {
  try {
    const command = new ListBucketsCommand({});
    const spaces = await s3Client.send(command);
    
    res.json({
      success: true,
      message: 'Connected to DO Spaces!',
      spaces: spaces.Buckets?.map(b => b.Name)
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Connection failed',
      error: error.message
    });
  }
});

// GET /api/spaces-test/list-files
router.get('/list-files', async (req, res) => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.DO_SPACES_BUCKET!, // Note: changed from DO_SPACES_NAME
      Prefix: 'test/',
      MaxKeys: 10
    });
    
    const data = await s3Client.send(command);
    
    res.json({
      success: true,
      files: data.Contents?.map(file => ({
        key: file.Key,
        size: file.Size,
        lastModified: file.LastModified,
        url: `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_REGION}.digitaloceanspaces.com/${file.Key}`
      }))
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;