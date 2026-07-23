import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { memoryUpload } from '../middleware/upload.js';
import { uploadBufferToCloudinary } from '../utils/cloudinaryUpload.js';

const router = Router();

router.post('/', verifyToken, memoryUpload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image provided' });
  try {
    const result = await uploadBufferToCloudinary(req.file.buffer, 'dierashop/general');
    res.json({ url: result.url, publicId: result.publicId, width: result.width, height: result.height, format: result.format });
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    res.status(500).json({ error: 'Image upload failed' });
  }
});

export default router;
