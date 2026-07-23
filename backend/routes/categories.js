import { Router } from 'express';
import Category from '../models/Category.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { memoryUpload } from '../middleware/upload.js';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../utils/cloudinaryUpload.js';

const router = Router();

const mapCat = (c) => ({
  id: c._id,
  _id: c._id,
  name: c.name,
  slug: c.slug,
  image_url: c.imageUrl,
  imageUrl: c.imageUrl,
  sort_order: c.sortOrder,
  sortOrder: c.sortOrder,
  show_in_header: c.showInHeader,
  showInHeader: c.showInHeader,
  show_in_footer: c.showInFooter,
  showInFooter: c.showInFooter,
  created_at: c.createdAt,
});

router.get('/', async (req, res) => {
  try {
    // Disable caching for all requests to ensure real-time updates
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const items = await Category.find().sort({ sortOrder: 1, name: 1 }).lean();
    res.json(items.map(mapCat));
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.get('/slug/:slug', async (req, res) => {
  try {
    // Cache category pages for 10 minutes
    res.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=3600');
    
    const cat = await Category.findOne({ slug: req.params.slug }).lean();
    if (!cat) return res.status(404).json({ error: 'Not found' });
    res.json(mapCat(cat));
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

router.post('/', verifyToken, requireAdmin, async (req, res) => {
  const { name, slug, imageUrl, sortOrder, showInHeader, showInFooter } = req.body;
  const cat = await Category.create({ 
    name, 
    slug, 
    imageUrl: imageUrl || '', 
    sortOrder: sortOrder ?? 0,
    showInHeader: showInHeader ?? true,
    showInFooter: showInFooter ?? true
  });
  
  // Emit socket event for real-time updates
  const io = req.app.get('io');
  io.emit('category:created', mapCat(cat));
  
  res.status(201).json(mapCat(cat));
});

router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  const { name, slug, sortOrder, showInHeader, showInFooter } = req.body;
  const cat = await Category.findByIdAndUpdate(
    req.params.id,
    { name, slug, sortOrder, showInHeader, showInFooter },
    { new: true }
  );
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  
  // Emit socket event for real-time updates
  const io = req.app.get('io');
  io.emit('category:updated', mapCat(cat));
  
  res.json(mapCat(cat));
});

router.post('/:id/image', verifyToken, requireAdmin, memoryUpload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image provided' });

  const cat = await Category.findById(req.params.id);
  if (!cat) return res.status(404).json({ error: 'Category not found' });

  if (cat.imagePublicId) {
    await deleteFromCloudinary(cat.imagePublicId);
  }

  const result = await uploadBufferToCloudinary(req.file.buffer, 'dierashop/categories');

  cat.imageUrl = result.url;
  cat.imagePublicId = result.publicId;
  await cat.save();

  res.json({ ok: true, imageUrl: result.url, publicId: result.publicId, ...mapCat(cat) });
});

router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  const cat = await Category.findById(req.params.id);
  if (cat?.imagePublicId) {
    await deleteFromCloudinary(cat.imagePublicId);
  }
  await Category.findByIdAndDelete(req.params.id);
  
  // Emit socket event for real-time updates
  const io = req.app.get('io');
  io.emit('category:deleted', { id: req.params.id });
  
  res.json({ ok: true });
});

export default router;
