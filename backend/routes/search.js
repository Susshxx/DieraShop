import { Router } from 'express';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

const router = Router();

const PAGES = [
  { name: 'Our Story', path: '/about/our-story' },
  { name: 'Size Guide', path: '/about/size-guide' },
  { name: 'Customer Care', path: '/about/customer-care' },
  { name: 'Store Locator', path: '/about/store-locator' },
];

router.get('/', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ products: [], categories: [], pages: [] });

  let products = [];
  try {
    products = await Product.find(
      { $text: { $search: q }, active: true },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(8)
      .lean();
  } catch {
    products = await Product.find({
      active: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
      ],
    })
      .limit(8)
      .lean();
  }

  const categories = await Category.find({ name: { $regex: q, $options: 'i' } }).limit(8).lean();
  const pages = PAGES.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 8);

  res.json({
    products: products.map((p) => ({
      id: p._id,
      name: p.name,
      slug: p.slug,
      price: p.priceNPR,
      price_npr: p.priceNPR,
      images: p.images,
      description: p.description,
    })),
    categories: categories.map((c) => ({ id: c._id, name: c.name, slug: c.slug })),
    pages,
  });
});

export default router;
