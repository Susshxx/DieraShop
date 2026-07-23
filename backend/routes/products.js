// import { Router } from 'express';
// import Product from '../models/Product.js';
// import Category from '../models/Category.js';
// import { verifyToken, requireAdmin } from '../middleware/auth.js';
// import { memoryUpload } from '../middleware/upload.js';
// import { processImageToWebp, bufferToDataUri } from '../utils/imageProcessor.js';

// const router = Router();

// const mapProduct = (p) => {
//   // Handle colorImageMap and variantStock which can be Map, Object, or undefined
//   let colorImageMap = {};
//   let variantStock = {};
  
//   if (p.colorImageMap) {
//     if (p.colorImageMap instanceof Map) {
//       colorImageMap = Object.fromEntries(p.colorImageMap);
//     } else if (typeof p.colorImageMap === 'object') {
//       colorImageMap = p.colorImageMap;
//     }
//   }
  
//   if (p.variantStock) {
//     if (p.variantStock instanceof Map) {
//       variantStock = Object.fromEntries(p.variantStock);
//     } else if (typeof p.variantStock === 'object') {
//       variantStock = p.variantStock;
//     }
//   }
  
//   return {
//     id: p._id,
//     _id: p._id,
//     name: p.name,
//     slug: p.slug,
//     description: p.description,
//     price_npr: p.priceNPR,
//     priceNPR: p.priceNPR,
//     price: p.priceNPR,
//     originalPriceNPR: p.originalPriceNPR,
//     discountPercent: p.discountPercent,
//     category_id: p.categoryId,
//     categoryId: p.categoryId,
//     stock: p.stock,
//     images: p.images,
//     sizes: p.sizes,
//     colors: p.colors,
//     colorImageMap,
//     variantStock,
//     tags: p.tags,
//     featured: p.featured,
//     active: p.active,
//     created_at: p.createdAt,
//     updated_at: p.updatedAt,
//     categories: p.categoryId && typeof p.categoryId === 'object' ? { name: p.categoryId.name } : undefined,
//   };
// };

// router.get('/', async (req, res) => {
//   try {
//     const filter = {};
//     if (req.query.featured === 'true') filter.featured = true;
//     if (req.query.active !== 'false') filter.active = true;
//     if (req.query.categoryId) filter.categoryId = req.query.categoryId;
//     const limit = Math.min(Number(req.query.limit) || 50, 200);
    
//     // Disable caching for admin requests, enable for public requests
//     const isAdmin = req.query.admin === 'true' || req.headers['x-admin'] === 'true';
    
//     if (isAdmin) {
//       // Admin: no cache at all
//       res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
//       res.set('Pragma', 'no-cache');
//       res.set('Expires', '0');
//     } else {
//       // Public: cache for 5 minutes
//       res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
//     }
    
//     // Use lean() for faster queries and select only needed fields
//     const query = Product.find(filter)
//       .select('name slug priceNPR originalPriceNPR discountPercent images colors sizes stock variantStock colorImageMap featured active createdAt categoryId')
//       .sort({ createdAt: -1 })
//       .limit(limit)
//       .lean();
    
//     if (req.query.populate === 'category') {
//       query.populate('categoryId', 'name slug');
//     }
    
//     const products = await query;
//     res.json(products.map(mapProduct));
//   } catch (error) {
//     console.error('Error fetching products:', error);
//     res.status(500).json({ error: 'Failed to fetch products' });
//   }
// });

// router.get('/slug/:slug', async (req, res) => {
//   try {
//     // Cache product pages for 10 minutes
//     res.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=3600');
    
//     const product = await Product.findOne({ slug: req.params.slug, active: true }).lean();
//     if (!product) return res.status(404).json({ error: 'Not found' });
//     res.json(mapProduct(product));
//   } catch (error) {
//     console.error('Error fetching product:', error);
//     res.status(500).json({ error: 'Failed to fetch product' });
//   }
// });

// router.get('/:id', async (req, res) => {
//   const product = await Product.findById(req.params.id).populate('categoryId', 'name slug').lean();
//   if (!product) return res.status(404).json({ error: 'Not found' });
//   res.json(mapProduct(product));
// });

// router.post('/', verifyToken, requireAdmin, async (req, res) => {
//   const body = req.body;
//   const product = await Product.create({
//     name: body.name,
//     slug: body.slug,
//     description: body.description || '',
//     priceNPR: body.price_npr ?? body.priceNPR ?? 0,
//     originalPriceNPR: body.originalPriceNPR ?? body.original_price_npr ?? null,
//     discountPercent: body.discountPercent ?? body.discount_percent ?? 0,
//     categoryId: body.category_id || body.categoryId || null,
//     stock: body.stock ?? 0,
//     images: body.images || [],
//     sizes: body.sizes || [],
//     colors: body.colors || [],
//     colorImageMap: body.colorImageMap || {},
//     variantStock: body.variantStock || {},
//     tags: body.tags || [],
//     featured: body.featured ?? false,
//     active: body.active ?? true,
//   });
//   res.status(201).json(mapProduct(product));
// });

// router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
//   const body = req.body;
//   const product = await Product.findByIdAndUpdate(
//     req.params.id,
//     {
//       name: body.name,
//       slug: body.slug,
//       description: body.description,
//       priceNPR: body.price_npr ?? body.priceNPR,
//       originalPriceNPR: body.originalPriceNPR ?? body.original_price_npr,
//       discountPercent: body.discountPercent ?? body.discount_percent,
//       categoryId: body.category_id || body.categoryId,
//       stock: body.stock,
//       images: body.images,
//       sizes: body.sizes,
//       colors: body.colors,
//       colorImageMap: body.colorImageMap,
//       variantStock: body.variantStock,
//       tags: body.tags,
//       featured: body.featured,
//       active: body.active,
//     },
//     { new: true }
//   );
//   if (!product) return res.status(404).json({ error: 'Not found' });
//   res.json(mapProduct(product));
// });

// router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
//   await Product.findByIdAndDelete(req.params.id);
//   res.json({ ok: true });
// });

// router.post('/:id/image', verifyToken, requireAdmin, memoryUpload.single('image'), async (req, res) => {
//   if (!req.file) return res.status(400).json({ error: 'No image provided' });
//   const webp = await processImageToWebp(req.file.buffer);
//   const dataUri = bufferToDataUri(webp);
//   const product = await Product.findById(req.params.id);
//   if (!product) return res.status(404).json({ error: 'Not found' });
//   product.images.push(dataUri);
//   await product.save();
//   res.json({ ok: true, image: dataUri, images: product.images });
// });

// export default router;


import { Router } from 'express';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { memoryUpload } from '../middleware/upload.js';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../utils/cloudinaryUpload.js';

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
  try {
    const filter = {};
    if (req.query.featured === 'true') filter.featured = true;
    if (req.query.active !== 'false') filter.active = true;
    if (req.query.categoryId) filter.categoryId = req.query.categoryId;
    const limit = Math.min(Number(req.query.limit) || 50, 200);

    // Disable caching for all requests to ensure real-time updates
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    // Pass ?fullImages=true (e.g. on a product detail/gallery view that
    // reuses this list route) to get every image; otherwise only the
    // first image per product is transferred from MongoDB.
    const wantsFullImages = req.query.fullImages === 'true';

    // Using a projection object (instead of a space-separated string)
    // lets us apply $slice, which trims the images array at the
    // database level — much less data over the wire than fetching
    // everything and slicing it in Node afterward.
    const projection = {
      name: 1,
      slug: 1,
      priceNPR: 1,
      originalPriceNPR: 1,
      discountPercent: 1,
      colors: 1,
      sizes: 1,
      stock: 1,
      variantStock: 1,
      colorImageMap: 1,
      featured: 1,
      active: 1,
      createdAt: 1,
      categoryId: 1,
      images: wantsFullImages ? 1 : { $slice: 1 },
    };

    // Use lean() for faster queries — plain JS objects instead of
    // Mongoose documents.
    const query = Product.find(filter, projection)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    if (req.query.populate === 'category') {
      query.populate('categoryId', 'name slug');
    }

    const products = await query;
    res.json(products.map(mapProduct));
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/slug/:slug', async (req, res) => {
  try {
    // Cache product pages for 10 minutes
    res.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=3600');

    const product = await Product.findOne({ slug: req.params.slug, active: true }).lean();
    if (!product) return res.status(404).json({ error: 'Not found' });
    res.json(mapProduct(product));
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
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
  
  // Emit socket event for real-time updates
  const io = req.app.get('io');
  io.emit('product:created', mapProduct(product));
  
  res.status(201).json(mapProduct(product));
});

router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  const body = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });

  const newImages = body.images || product.images;
  const removedImages = product.images.filter((img) => !newImages.includes(img));
  for (const img of removedImages) {
    const idx = product.images.indexOf(img);
    const publicId = product.imagePublicIds?.[idx];
    if (publicId) await deleteFromCloudinary(publicId);
  }

  const updated = await Product.findByIdAndUpdate(
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
      images: newImages,
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

  const keptPublicIds = updated.imagePublicIds?.filter((_, idx) => newImages.includes(updated.images[idx])) || [];
  await Product.findByIdAndUpdate(req.params.id, { imagePublicIds: keptPublicIds });

  // Emit socket event for real-time updates
  const io = req.app.get('io');
  io.emit('product:updated', mapProduct(updated));

  res.json(mapProduct(updated));
});

router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      console.log(`[delete] Product ${req.params.id} not found, may already be deleted`);
      return res.json({ ok: true });
    }

    console.log(`[delete] Deleting product ${req.params.id}: ${product.name}`);
    
    // Delete images from Cloudinary
    if (product.imagePublicIds && product.imagePublicIds.length > 0) {
      console.log(`[delete] Deleting ${product.imagePublicIds.length} images from Cloudinary`);
      for (const publicId of product.imagePublicIds || []) {
        try {
          await deleteFromCloudinary(publicId);
          console.log(`[delete] Deleted image ${publicId}`);
        } catch (err) {
          console.error(`[delete] Failed to delete image ${publicId}:`, err);
          // Continue with deletion even if image deletion fails
        }
      }
    }

    // Delete product from database
    const deleteResult = await Product.findByIdAndDelete(req.params.id);
    if (!deleteResult) {
      console.error(`[delete] Failed to delete product ${req.params.id} from database`);
      return res.status(500).json({ error: 'Failed to delete product from database' });
    }
    
    console.log(`[delete] Successfully deleted product ${req.params.id} from database`);
    
    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('product:deleted', { id: req.params.id });
      console.log(`[delete] Emitted product:deleted event for ${req.params.id}`);
    }
    
    res.json({ ok: true });
  } catch (error) {
    console.error('[delete] Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

router.post('/:id/image', verifyToken, requireAdmin, memoryUpload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image provided' });
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });

  const result = await uploadBufferToCloudinary(req.file.buffer, 'dierashop/products');

  product.images.push(result.url);
  product.imagePublicIds.push(result.publicId);
  await product.save();

  res.json({ ok: true, image: result.url, publicId: result.publicId, images: product.images });
});

export default router;