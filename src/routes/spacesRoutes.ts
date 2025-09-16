import { Router } from 'express';
import AWS from 'aws-sdk';
import multer from 'multer';

const router = Router();

// Configure DO Spaces
const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT || 'sgp1.digitaloceanspaces.com');
const s3 = new AWS.S3({
  endpoint: spacesEndpoint as any,
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET
});

// Multer for handling file uploads
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/spaces-test/connection
router.get('/connection', async (req, res) => {
  try {
    const spaces = await s3.listBuckets().promise();
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

// POST /api/spaces-test/upload-text
router.post('/upload-text', async (req, res) => {
  try {
    const testContent = req.body.content || 'Hello from API test!';
    const fileName = `test/test-${Date.now()}.txt`;
    
    const params = {
      Bucket: process.env.DO_SPACES_NAME!,
      Key: fileName,
      Body: testContent,
      ACL: 'public-read',
      ContentType: 'text/plain'
    };
    
    const result = await s3.upload(params).promise();
    
    res.json({
      success: true,
      message: 'Text file uploaded!',
      url: result.Location,
      key: result.Key
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/spaces-test/upload-file
router.post('/upload-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    const fileName = `test/${Date.now()}-${req.file.originalname}`;
    
    const params = {
      Bucket: process.env.DO_SPACES_NAME!,
      Key: fileName,
      Body: req.file.buffer,
      ACL: 'public-read',
      ContentType: req.file.mimetype
    };
    
    const result = await s3.upload(params).promise();
    
    res.json({
      success: true,
      message: 'File uploaded!',
      file: {
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        url: result.Location,
        key: result.Key
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/spaces-test/list-files
router.get('/list-files', async (req, res) => {
  try {
    const params = {
      Bucket: process.env.DO_SPACES_NAME!,
      Prefix: 'test/', // Only list test files
      MaxKeys: 10
    };
    
    const data = await s3.listObjectsV2(params).promise();
    
    res.json({
      success: true,
      files: data.Contents?.map(file => ({
        key: file.Key,
        size: file.Size,
        lastModified: file.LastModified,
        url: `${process.env.DO_SPACES_ENDPOINT}/${process.env.DO_SPACES_NAME}/${file.Key}`
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