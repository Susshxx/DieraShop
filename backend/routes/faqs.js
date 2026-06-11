import { Router } from 'express';
import Faq from '../models/Faq.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Get all active FAQs (public)
router.get('/', async (req, res) => {
  try {
    const faqs = await Faq.find({ active: true }).sort({ order: 1, createdAt: 1 });
    res.json(faqs);
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

// Get all FAQs (admin)
router.get('/all', verifyToken, requireAdmin, async (req, res) => {
  try {
    const faqs = await Faq.find().sort({ order: 1, createdAt: 1 });
    res.json(faqs);
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

// Create FAQ (admin)
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { question, answer, order } = req.body;
    const faq = await Faq.create({ question, answer, order: order || 0 });
    res.status(201).json(faq);
  } catch (error) {
    console.error('Error creating FAQ:', error);
    res.status(500).json({ error: 'Failed to create FAQ' });
  }
});

// Update FAQ (admin)
router.patch('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { question, answer, order, active } = req.body;
    const faq = await Faq.findByIdAndUpdate(
      req.params.id,
      { question, answer, order, active },
      { new: true }
    );
    if (!faq) return res.status(404).json({ error: 'FAQ not found' });
    res.json(faq);
  } catch (error) {
    console.error('Error updating FAQ:', error);
    res.status(500).json({ error: 'Failed to update FAQ' });
  }
});

// Delete FAQ (admin)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const faq = await Faq.findByIdAndDelete(req.params.id);
    if (!faq) return res.status(404).json({ error: 'FAQ not found' });
    res.json({ message: 'FAQ deleted successfully' });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({ error: 'Failed to delete FAQ' });
  }
});

export default router;
