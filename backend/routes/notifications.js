import { Router } from 'express';
import Notification from '../models/Notification.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

const mapN = (n) => ({
  id: n._id,
  _id: n._id,
  user_id: n.userId,
  type: n.type,
  title: n.title,
  body: n.body,
  link: n.link,
  read_at: n.readAt,
  created_at: n.createdAt,
});

router.get('/', verifyToken, async (req, res) => {
  // Exclude chat notifications
  const items = await Notification.find({ 
    userId: req.user.id,
    type: { $ne: 'chat' }
  }).sort({ createdAt: -1 }).limit(50);
  res.json(items.map(mapN));
});

router.get('/unread-count', verifyToken, async (req, res) => {
  // Exclude chat notifications from count
  const count = await Notification.countDocuments({ 
    userId: req.user.id, 
    readAt: null,
    type: { $ne: 'chat' }
  });
  res.json({ count });
});

router.post('/mark-read', verifyToken, async (req, res) => {
  await Notification.updateMany(
    { userId: req.user.id, readAt: null },
    { readAt: new Date() }
  );
  
  // Emit socket event to update notification badge
  const io = req.app.get('io');
  if (io) {
    console.log(`[Notifications] Emitting notifications:read to user:${req.user.id}`);
    io.to(`user:${req.user.id}`).emit('notifications:read');
  }
  
  res.json({ ok: true });
});

router.patch('/:id/read', verifyToken, async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { readAt: new Date() }
  );
  res.json({ ok: true });
});

export default router;
