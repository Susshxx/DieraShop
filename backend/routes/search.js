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
  try {
    const q = (req.query.q || '').trim();
    console.log('[search] Query received:', q, 'Length:', q.length);
    if (!q) return res.json({ products: [], categories: [], pages: [] });

    // Cache search results for 2 minutes
    res.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=600');

    let products = [];
    try {
      // Use regex search for partial matching as user types
      const searchRegex = new RegExp(q, 'i');
      console.log('[search] Using regex:', searchRegex);
      
      products = await Product.find({
        active: true,
        $or: [
          { name: { $regex: searchRegex } },
          { description: { $regex: searchRegex } },
          { tags: { $regex: searchRegex } },
        ],
      })
        .select('name slug priceNPR images description')
        .limit(8)
        .lean();
      
      console.log('[search] Found products:', products.length);
    } catch (err) {
      console.error('Search error:', err);
      products = [];
    }

    const categories = await Category.find({ name: { $regex: q, $options: 'i' } })
      .select('name slug')
      .limit(8)
      .lean();
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
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
