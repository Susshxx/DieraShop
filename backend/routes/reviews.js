import { Router } from 'express';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { verifyToken } from '../middleware/auth.js';
import { memoryUpload } from '../middleware/upload.js';
import { bufferToDataUri } from '../utils/imageProcessor.js';

const router = Router();

const mapReview = (r) => ({
  id: r._id,
  _id: r._id,
  product_id: r.productId,
  order_id: r.orderId,
  user_id: r.userId?._id || r.userId,
  rating: r.rating,
  comment: r.comment,
  images: r.images || [],
  verified: r.verified,
  created_at: r.createdAt,
  user_name: r.userId && typeof r.userId === 'object' ? r.userId.name : 'Anonymous',
});

// Get reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews.map(mapReview));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Get user's review for a product (if exists)
router.get('/user/:productId', verifyToken, async (req, res) => {
  try {
    const review = await Review.findOne({
      userId: req.user.id,
      productId: req.params.productId,
    }).populate('userId', 'name');
    
    if (!review) {
      return res.json(null);
    }
    
    res.json(mapReview(review));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

// Update a review
router.put('/:id', verifyToken, memoryUpload.array('images', 5), async (req, res) => {
  try {
    const { rating, comment, existingImages } = req.body;
    
    const review = await Review.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Process new images
    const newImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (file.size > 5 * 1024 * 1024) {
          return res.status(400).json({ error: 'Image too large. Max 5MB per image.' });
        }
        const dataUri = bufferToDataUri(file.buffer, file.mimetype);
        newImages.push(dataUri);
      }
    }

    // Combine existing images (if any) with new images
    const existingImagesArray = existingImages ? JSON.parse(existingImages) : [];
    const allImages = [...existingImagesArray, ...newImages].slice(0, 5);

    review.rating = parseInt(rating);
    review.comment = comment;
    review.images = allImages;
    await review.save();

    const populated = await Review.findById(review._id).populate('userId', 'name');
    res.json(mapReview(populated));
  } catch (error) {
    console.error('Review update error:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});
// Check if user can review a product (has delivered order with this product)
router.get('/can-review/:productId', verifyToken, async (req, res) => {
  try {
    const productId = req.params.productId;
    
    // Find delivered orders containing this product
    const orders = await Order.find({
      userId: req.user.id,
      status: 'delivered',
      'items.productId': productId,
    });

    if (orders.length === 0) {
      return res.json({ canReview: false, orderId: null });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      userId: req.user.id,
      productId,
    });

    if (existingReview) {
      return res.json({ canReview: false, orderId: orders[0]._id, alreadyReviewed: true, review: mapReview(existingReview) });
    }

    res.json({ canReview: true, orderId: orders[0]._id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check review eligibility' });
  }
});

// Create a review
router.post('/', verifyToken, memoryUpload.array('images', 5), async (req, res) => {
  try {
    const { productId, orderId, rating, comment } = req.body;
    
    if (!productId || !orderId || !rating || !comment) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify order exists, is delivered, and belongs to user
    const order = await Order.findOne({
      _id: orderId,
      userId: req.user.id,
      status: 'delivered',
      'items.productId': productId,
    });

    if (!order) {
      return res.status(403).json({ error: 'You can only review products from your delivered orders' });
    }

    // Check if already reviewed
    const existing = await Review.findOne({
      userId: req.user.id,
      productId,
    });

    if (existing) {
      return res.status(400).json({ error: 'You have already reviewed this product. Use the edit feature to update your review.' });
    }

    // Process images
    const images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (file.size > 5 * 1024 * 1024) {
          return res.status(400).json({ error: 'Image too large. Max 5MB per image.' });
        }
        const dataUri = bufferToDataUri(file.buffer, file.mimetype);
        images.push(dataUri);
      }
    }

    const review = await Review.create({
      productId,
      orderId,
      userId: req.user.id,
      rating: parseInt(rating),
      comment,
      images,
    });

    const populated = await Review.findById(review._id).populate('userId', 'name');
    res.status(201).json(mapReview(populated));
  } catch (error) {
    console.error('Review creation error:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// Get average rating for a product
router.get('/product/:productId/stats', async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId });
    
    if (reviews.length === 0) {
      return res.json({ averageRating: 0, totalReviews: 0 });
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / reviews.length;

    res.json({
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
