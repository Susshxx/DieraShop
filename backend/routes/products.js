import { Router } from 'express';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { memoryUpload } from '../middleware/upload.js';
import { processImageToWebp, bufferToDataUri } from '../utils/imageProcessor.js';

const router = Router();

const mapProduct = (p) => {
  // Handle colorImageMap and variantStock which can be Map, Object, or undefined
  let colorImageMap = {};
  let variantStock = {};
  
  if (p.colorImageMap) {
    if (p.colorImageMap instanceof Map) {
      colorImageMap = Object.fromEntries(p.colorImageMap);
    } else if (typeof p.colorImageMap === 'object') {
      colorImageMap = p.colorImageMap;
    }
  }
  
  if (p.variantStock) {
    if (p.variantStock instanceof Map) {
      variantStock = Object.fromEntries(p.variantStock);
    } else if (typeof p.variantStock === 'object') {
      variantStock = p.variantStock;
    }
  }
  
  return {
    id: p._id,
    _id: p._id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price_npr: p.priceNPR,
    priceNPR: p.priceNPR,
    price: p.priceNPR,
    originalPriceNPR: p.originalPriceNPR,
    discountPercent: p.discountPercent,
    category_id: p.categoryId,
    categoryId: p.categoryId,
    stock: p.stock,
    images: p.images,
    sizes: p.sizes,
    colors: p.colors,
    colorImageMap,
    variantStock,
    tags: p.tags,
    featured: p.featured,
    active: p.active,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
    categories: p.categoryId && typeof p.categoryId === 'object' ? { name: p.categoryId.name } : undefined,
  };
};

router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.featured === 'true') filter.featured = true;
  if (req.query.active !== 'false') filter.active = true;
  if (req.query.categoryId) filter.categoryId = req.query.categoryId;
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  
  // Only populate category if explicitly requested (saves significant time)
  const query = Product.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
  
  if (req.query.populate === 'category') {
    query.populate('categoryId', 'name slug');
  }
  
  const products = await query;
  res.json(products.map(mapProduct));
});

router.get('/slug/:slug', async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, active: true }).lean();
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(mapProduct(product));
});

router.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id).populate('categoryId', 'name slug').lean();
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
    originalPriceNPR: body.originalPriceNPR ?? body.original_price_npr ?? null,
    discountPercent: body.discountPercent ?? body.discount_percent ?? 0,
    categoryId: body.category_id || body.categoryId || null,
    stock: body.stock ?? 0,
    images: body.images || [],
    sizes: body.sizes || [],
    colors: body.colors || [],
    colorImageMap: body.colorImageMap || {},
    variantStock: body.variantStock || {},
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
      originalPriceNPR: body.originalPriceNPR ?? body.original_price_npr,
      discountPercent: body.discountPercent ?? body.discount_percent,
      categoryId: body.category_id || body.categoryId,
      stock: body.stock,
      images: body.images,
      sizes: body.sizes,
      colors: body.colors,
      colorImageMap: body.colorImageMap,
      variantStock: body.variantStock,
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
