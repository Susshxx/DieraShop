import { Router } from 'express';
import Question from '../models/Question.js';
import Notification from '../models/Notification.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = Router();
const adminRouter = Router();

const mapQ = (q) => ({
  id: q._id,
  _id: q._id,
  product_id: q.productId,
  productId: q.productId,
  user_id: q.userId?._id || q.userId,
  question: q.question,
  answer: q.answer,
  answered_at: q.answeredAt,
  created_at: q.createdAt,
  profiles: q.userId && typeof q.userId === 'object' ? { full_name: q.userId.name } : undefined,
});

router.get('/product/:productId', async (req, res) => {
  const questions = await Question.find({ productId: req.params.productId })
    .populate('userId', 'name')
    .sort({ createdAt: -1 });
  res.json(questions.map(mapQ));
});

router.post('/', verifyToken, async (req, res) => {
  const { productId, question } = req.body;
  const q = await Question.create({ productId, userId: req.user.id, question });
  const io = req.app.get('io');
  if (io) io.emit('product_questions', { productId, question: mapQ(q) });
  res.status(201).json(mapQ(q));
});

adminRouter.get('/', verifyToken, requireAdmin, async (_req, res) => {
  const questions = await Question.find().populate('userId', 'name').populate('productId', 'name slug').sort({ createdAt: -1 });
  res.json(
    questions.map((q) => ({
      ...mapQ(q),
      products: q.productId && typeof q.productId === 'object' ? { name: q.productId.name, slug: q.productId.slug } : undefined,
    }))
  );
});

adminRouter.patch('/:id/answer', verifyToken, requireAdmin, async (req, res) => {
  const { answer } = req.body;
  const q = await Question.findByIdAndUpdate(
    req.params.id,
    { answer, answeredAt: new Date(), answeredBy: req.user.id },
    { new: true }
  ).populate('userId', 'name');
  if (!q) return res.status(404).json({ error: 'Not found' });

  const notif = await Notification.create({
    userId: q.userId._id || q.userId,
    type: 'qa',
    title: 'Your question was answered',
    body: answer.slice(0, 120),
    link: `/product/${q.productId}`,
  });

  const io = req.app.get('io');
  if (io) {
    io.to(`user:${q.userId._id || q.userId}`).emit('notification:new', notif);
    io.emit('product_answers', { productId: q.productId, answer: mapQ(q) });
  }

  res.json(mapQ(q));
});

export { router as default, adminRouter };
