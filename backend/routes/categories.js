import { Router } from 'express';
import Category from '../models/Category.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { memoryUpload } from '../middleware/upload.js';
import { processImageToWebp, bufferToDataUri } from '../utils/imageProcessor.js';

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
  created_at: c.createdAt,
});

router.get('/', async (_req, res) => {
  const items = await Category.find().sort({ sortOrder: 1, name: 1 });
  res.json(items.map(mapCat));
});

router.get('/slug/:slug', async (req, res) => {
  const cat = await Category.findOne({ slug: req.params.slug });
  if (!cat) return res.status(404).json({ error: 'Not found' });
  res.json(mapCat(cat));
});

router.post('/', verifyToken, requireAdmin, async (req, res) => {
  const { name, slug, imageUrl, sortOrder, showInHeader } = req.body;
  const cat = await Category.create({ 
    name, 
    slug, 
    imageUrl: imageUrl || '', 
    sortOrder: sortOrder ?? 0,
    showInHeader: showInHeader ?? true 
  });
  res.status(201).json(mapCat(cat));
});

router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  const { name, slug, sortOrder, showInHeader } = req.body;
  const cat = await Category.findByIdAndUpdate(
    req.params.id,
    { name, slug, sortOrder, showInHeader },
    { new: true }
  );
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  res.json(mapCat(cat));
});

router.post('/:id/image', verifyToken, requireAdmin, memoryUpload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image provided' });
  const webp = await processImageToWebp(req.file.buffer);
  const dataUri = bufferToDataUri(webp);
  const cat = await Category.findByIdAndUpdate(req.params.id, { imageUrl: dataUri }, { new: true });
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  res.json({ ok: true, imageUrl: dataUri, ...mapCat(cat) });
});

router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
