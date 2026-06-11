import { Router } from 'express';
import User from '../models/User.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

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
    email: user.email,
    avatar_url: user.avatarUrl,
  });
});

router.patch('/profile', verifyToken, async (req, res) => {
  const { full_name, name, phone, address } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name: full_name || name, phone, address },
    { new: true }
  ).select('-passwordHash');
  res.json({
    id: user._id,
    full_name: user.name,
    phone: user.phone,
    address: user.address,
  });
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
