import { Router } from 'express';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { memoryUpload } from '../middleware/upload.js';
import { processImageToWebp, bufferToDataUri } from '../utils/imageProcessor.js';

const router = Router();

const mapProduct = (p) => ({
  id: p._id,
  _id: p._id,
  name: p.name,
  slug: p.slug,
  description: p.description,
  price_npr: p.priceNPR,
  priceNPR: p.priceNPR,
  price: p.priceNPR,
  category_id: p.categoryId,
  categoryId: p.categoryId,
  stock: p.stock,
  images: p.images,
  sizes: p.sizes,
  colors: p.colors,
  colorImageMap: p.colorImageMap ? Object.fromEntries(p.colorImageMap) : {},
  tags: p.tags,
  featured: p.featured,
  active: p.active,
  created_at: p.createdAt,
  updated_at: p.updatedAt,
  categories: p.categoryId && typeof p.categoryId === 'object' ? { name: p.categoryId.name } : undefined,
});

router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.featured === 'true') filter.featured = true;
  if (req.query.active !== 'false') filter.active = true;
  if (req.query.categoryId) filter.categoryId = req.query.categoryId;
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const products = await Product.find(filter).populate('categoryId', 'name slug').sort({ createdAt: -1 }).limit(limit);
  res.json(products.map(mapProduct));
});

router.get('/slug/:slug', async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, active: true });
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(mapProduct(product));
});

router.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id).populate('categoryId', 'name slug');
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(mapProduct(product));
});

router.post('/', verifyToken, requireAdmin, async (req, res) => {
  const body = req.body;
  const product = await Product.create({
    name: body.name,
    slug: body.slug,
    description: body.description || '',
    priceNPR: body.price_npr ?? body.priceNPR ?? 0,
    categoryId: body.category_id || body.categoryId || null,
    stock: body.stock ?? 0,
    images: body.images || [],
    sizes: body.sizes || [],
    colors: body.colors || [],
    colorImageMap: body.colorImageMap || {},
    tags: body.tags || [],
    featured: body.featured ?? false,
    active: body.active ?? true,
  });
  res.status(201).json(mapProduct(product));
});

router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  const body = req.body;
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    {
      name: body.name,
      slug: body.slug,
      description: body.description,
      priceNPR: body.price_npr ?? body.priceNPR,
      categoryId: body.category_id || body.categoryId,
      stock: body.stock,
      images: body.images,
      sizes: body.sizes,
      colors: body.colors,
      colorImageMap: body.colorImageMap,
      tags: body.tags,
      featured: body.featured,
      active: body.active,
    },
    { new: true }
  );
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(mapProduct(product));
});

router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

router.post('/:id/image', verifyToken, requireAdmin, memoryUpload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image provided' });
  const webp = await processImageToWebp(req.file.buffer);
  const dataUri = bufferToDataUri(webp);
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  product.images.push(dataUri);
  await product.save();
  res.json({ ok: true, image: dataUri, images: product.images });
});

export default router;
