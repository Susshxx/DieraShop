import { Router } from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Question from '../models/Question.js';
import ChatConversation from '../models/ChatConversation.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, requireAdmin, async (_req, res) => {
  const [productCount, orderCount, userCount, questionCount, chatCount, orders] = await Promise.all([
    Product.countDocuments(),
    Order.countDocuments(),
    User.countDocuments(),
    Question.countDocuments({ $or: [{ answer: '' }, { answer: { $exists: false } }] }),
    ChatConversation.countDocuments({ unreadAdmin: { $gt: 0 } }),
    Order.find({ revenueRecorded: true }).select('totalNPR'),
  ]);

  const revenue = orders.reduce((s, o) => s + (o.totalNPR || 0), 0);

  res.json({
    products: productCount,
    orders: orderCount,
    users: userCount,
    pendingQuestions: questionCount,
    unreadChats: chatCount,
    revenue,
  });
});

export default router;
