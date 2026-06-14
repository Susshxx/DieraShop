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
  order_id: n.orderId,
  orderId: n.orderId,
  read: !!n.readAt,          // ← include read boolean so frontend can style correctly
  read_at: n.readAt,
  created_at: n.createdAt,
  createdAt: n.createdAt,
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

// POST /mark-read — mark all as read (legacy)
router.post('/mark-read', verifyToken, async (req, res) => {
  await Notification.updateMany(
    { userId: req.user.id, readAt: null },
    { readAt: new Date() }
  );
  const io = req.app.get('io');
  if (io) io.to(`user:${req.user.id}`).emit('notifications:read');
  res.json({ ok: true });
});

// PUT /read-all — mark all as read (frontend calls this)
router.put('/read-all', verifyToken, async (req, res) => {
  await Notification.updateMany(
    { userId: req.user.id, readAt: null },
    { readAt: new Date() }
  );
  const io = req.app.get('io');
  if (io) io.to(`user:${req.user.id}`).emit('notifications:read');
  res.json({ ok: true });
});

// PATCH /:id/read — mark one as read (legacy)
router.patch('/:id/read', verifyToken, async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { readAt: new Date() }
  );
  const io = req.app.get('io');
  if (io) io.to(`user:${req.user.id}`).emit('notifications:read');
  res.json({ ok: true });
});

// PUT /:id/read — mark one as read (frontend calls this)
router.put('/:id/read', verifyToken, async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { readAt: new Date() }
  );
  const io = req.app.get('io');
  if (io) io.to(`user:${req.user.id}`).emit('notifications:read');
  res.json({ ok: true });
});

// Delete a notification
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete all notifications
router.delete('/', verifyToken, async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user.id });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
