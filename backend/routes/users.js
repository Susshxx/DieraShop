import { Router } from 'express';
import User from '../models/User.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { memoryUpload } from '../middleware/upload.js';
import { processImageToWebp, bufferToDataUri } from '../utils/imageProcessor.js';

const router = Router();
const adminRouter = Router();

router.get('/profile', verifyToken, async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash');
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json({
    id: user._id,
    full_name: user.name,
    name: user.name,
    phone: user.phone,
    address: user.address,
    province: user.province,
    district: user.district,
    email: user.email,
    avatar_url: user.avatarUrl,
  });
});

router.patch('/profile', verifyToken, async (req, res) => {
  const { full_name, name, phone, address, province, district } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name: full_name || name, phone, address, province, district },
    { new: true }
  ).select('-passwordHash');
  res.json({
    id: user._id,
    full_name: user.name,
    phone: user.phone,
    address: user.address,
    province: user.province,
    district: user.district,
    avatar_url: user.avatarUrl,
  });
});

// Avatar upload — POST /users/profile/avatar
router.post('/profile/avatar', verifyToken, memoryUpload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image provided' });
  try {
    const webp = await processImageToWebp(req.file.buffer);
    const dataUri = bufferToDataUri(webp);
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatarUrl: dataUri },
      { new: true }
    ).select('-passwordHash');
    res.json({ avatar_url: user.avatarUrl });
  } catch {
    res.status(500).json({ error: 'Image processing failed' });
  }
});

adminRouter.get('/', verifyToken, requireAdmin, async (_req, res) => {
  const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
  res.json(
    users.map((u) => ({
      id: u._id,
      email: u.email,
      full_name: u.name,
      phone: u.phone,
      role: u.role,
      created_at: u.createdAt,
    }))
  );
});

export { router as default, adminRouter };
