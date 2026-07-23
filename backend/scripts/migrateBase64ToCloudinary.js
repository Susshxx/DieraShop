import 'dotenv/config';
import mongoose from 'mongoose';
import cloudinary from '../config/cloudinary.js';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../utils/cloudinaryUpload.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import SiteImage from '../models/SiteImage.js';
import Review from '../models/Review.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import ChatMessage from '../models/ChatMessage.js';

const isDataUri = (s) => typeof s === 'string' && /^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(s);

const dataUriToBuffer = (dataUri) => {
  const matches = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) return null;
  return Buffer.from(matches[2], 'base64');
};

const migrateProducts = async () => {
  let migrated = 0;
  let page = 0;
  const batchSize = 20;

  while (true) {
    const products = await Product.find()
      .skip(page * batchSize)
      .limit(batchSize)
      .lean();

    if (products.length === 0) break;

    for (const p of products) {
      const base64Images = (p.images || []).filter(isDataUri);
      if (base64Images.length === 0) {
        const sample = (p.images || []).slice(0, 1)[0];
        console.log(`[Products][skip] ${p._id}: images=${(p.images || []).length}, sample=${String(sample || '').slice(0, 60)}`);
        continue;
      }

      const newImages = [];
      const newPublicIds = [];

      for (const dataUri of base64Images) {
        try {
          const buffer = dataUriToBuffer(dataUri);
          if (!buffer) {
            newImages.push(dataUri);
            newPublicIds.push('');
            continue;
          }
          const result = await uploadBufferToCloudinary(buffer, 'dierashop/products');
          newImages.push(result.url);
          newPublicIds.push(result.publicId);
        } catch (err) {
          console.error(`Failed to migrate product ${p._id} image:`, err.message);
          newImages.push(dataUri);
          newPublicIds.push('');
        }
      }

      const mergedImages = (p.images || []).map((img) => {
        const idx = base64Images.indexOf(img);
        if (idx !== -1) return newImages[idx];
        return img;
      });

      const mergedPublicIds = (p.images || []).map((img, idx) => {
        if (isDataUri(img)) return newPublicIds[(p.images || []).slice(0, idx).filter(isDataUri).length];
        return (p.imagePublicIds && p.imagePublicIds[idx]) || '';
      });

      await Product.findByIdAndUpdate(p._id, {
        images: mergedImages,
        imagePublicIds: mergedPublicIds.filter(Boolean),
      });
      migrated++;
    }

    page++;
    console.log(`[Products] Migrated page ${page}`);
  }

  console.log(`[Products] Total migrated: ${migrated}`);
  return migrated;
};

const migrateCategories = async () => {
  let migrated = 0;
  let page = 0;
  const batchSize = 50;

  while (true) {
    const cats = await Category.find()
      .skip(page * batchSize)
      .limit(batchSize)
      .lean();

    if (cats.length === 0) break;

    for (const c of cats) {
      const isBase64 = isDataUri(c.imageUrl);
      console.log(`[Categories][debug] ${c._id}: imageUrl=${c.imageUrl ? 'PRESENT' : 'ABSENT'}, isBase64=${isBase64}, length=${c.imageUrl ? c.imageUrl.length : 0}, starts=${c.imageUrl ? c.imageUrl.slice(0, 60) : ''}`);
      if (!isBase64) continue;

      try {
        const buffer = dataUriToBuffer(c.imageUrl);
        if (!buffer) {
          console.log(`[Categories] ${c._id}: No buffer for base64 image`);
          continue;
        }
        console.log(`[Categories] ${c._id}: Buffer size=${buffer.length} bytes, uploading...`);
        const result = await uploadBufferToCloudinary(buffer, 'dierashop/categories');
        console.log(`[Categories] ${c._id}: Upload succeeded, url=${result.url}, publicId=${result.publicId}`);
        await Category.findByIdAndUpdate(c._id, {
          imageUrl: result.url,
          imagePublicId: result.publicId,
        });
        migrated++;
        console.log(`[Categories] ${c._id}: Updated successfully, migrated count=${migrated}`);
      } catch (err) {
        console.error(`Failed to migrate category ${c._id}:`, err.message);
      }
    }

    page++;
    console.log(`[Categories] Migrated page ${page}`);
  }

  console.log(`[Categories] Total migrated: ${migrated}`);
  return migrated;
};

const migrateSiteImages = async () => {
  let migrated = 0;
  let page = 0;
  const batchSize = 50;

  while (true) {
    const slots = await SiteImage.find()
      .skip(page * batchSize)
      .limit(batchSize)
      .lean();

    if (slots.length === 0) break;

    for (const s of slots) {
      const isBase64 = isDataUri(s.imageData);
      console.log(`[SiteImages][debug] ${s._id}: imageData=${s.imageData ? 'PRESENT' : 'ABSENT'}, isBase64=${isBase64}, length=${s.imageData ? s.imageData.length : 0}, starts=${s.imageData ? s.imageData.slice(0, 60) : ''}`);
      if (!isBase64) continue;

      try {
        const buffer = dataUriToBuffer(s.imageData);
        if (!buffer) {
          console.log(`[SiteImages] ${s._id}: No buffer for base64 image`);
          continue;
        }
        console.log(`[SiteImages] ${s._id}: Buffer size=${buffer.length} bytes, uploading...`);
        const result = await uploadBufferToCloudinary(buffer, 'dierashop/site-images');
        console.log(`[SiteImages] ${s._id}: Upload succeeded, url=${result.url}, publicId=${result.publicId}`);
        await SiteImage.findByIdAndUpdate(s._id, {
          imageData: result.url,
          imagePublicId: result.publicId,
        });
        migrated++;
        console.log(`[SiteImages] ${s._id}: Updated successfully, migrated count=${migrated}`);
      } catch (err) {
        console.error(`Failed to migrate site image ${s._id}:`, err.message);
      }
    }

    page++;
    console.log(`[SiteImages] Migrated page ${page}`);
  }

  console.log(`[SiteImages] Total migrated: ${migrated}`);
  return migrated;
};

const migrateReviews = async () => {
  let migrated = 0;
  let page = 0;
  const batchSize = 50;

  while (true) {
    const reviews = await Review.find()
      .skip(page * batchSize)
      .limit(batchSize)
      .lean();

    if (reviews.length === 0) break;

    for (const r of reviews) {
      const base64Images = (r.images || []).filter(isDataUri);
      if (base64Images.length === 0) continue;

      const newImages = [];
      const newPublicIds = [];

      for (const dataUri of base64Images) {
        try {
          const buffer = dataUriToBuffer(dataUri);
          if (!buffer) {
            newImages.push(dataUri);
            newPublicIds.push('');
            continue;
          }
          const result = await uploadBufferToCloudinary(buffer, 'dierashop/reviews');
          newImages.push(result.url);
          newPublicIds.push(result.publicId);
        } catch (err) {
          console.error(`Failed to migrate review ${r._id} image:`, err.message);
          newImages.push(dataUri);
          newPublicIds.push('');
        }
      }

      const mergedImages = (r.images || []).map((img) => {
        const idx = base64Images.indexOf(img);
        if (idx !== -1) return newImages[idx];
        return img;
      });

      const mergedPublicIds = (r.images || []).map((img, idx) => {
        if (isDataUri(img)) return newPublicIds[(r.images || []).slice(0, idx).filter(isDataUri).length];
        return '';
      });

      await Review.findByIdAndUpdate(r._id, {
        images: mergedImages,
        imagePublicIds: mergedPublicIds.filter(Boolean),
      });
      migrated++;
    }

    page++;
    console.log(`[Reviews] Migrated page ${page}`);
  }

  console.log(`[Reviews] Total migrated: ${migrated}`);
  return migrated;
};

const migrateUsers = async () => {
  let migrated = 0;
  let page = 0;
  const batchSize = 50;

  while (true) {
    const users = await User.find()
      .skip(page * batchSize)
      .limit(batchSize)
      .lean();

    if (users.length === 0) break;

    for (const u of users) {
      if (!isDataUri(u.avatarUrl)) continue;

      try {
        const buffer = dataUriToBuffer(u.avatarUrl);
        if (!buffer) continue;
        const result = await uploadBufferToCloudinary(buffer, 'dierashop/avatars');
        await User.findByIdAndUpdate(u._id, {
          avatarUrl: result.url,
          avatarPublicId: result.publicId,
        });
        migrated++;
      } catch (err) {
        console.error(`Failed to migrate user ${u._id}:`, err.message);
      }
    }

    page++;
    console.log(`[Users] Migrated page ${page}`);
  }

  console.log(`[Users] Total migrated: ${migrated}`);
  return migrated;
};

const migrateOrders = async () => {
  let migrated = 0;
  let page = 0;
  const batchSize = 50;

  while (true) {
    const orders = await Order.find()
      .skip(page * batchSize)
      .limit(batchSize)
      .lean();

    if (orders.length === 0) break;

    for (const o of orders) {
      let updated = false;
      const updateData = {};

      if (isDataUri(o.paymentScreenshot)) {
        try {
          const buffer = dataUriToBuffer(o.paymentScreenshot);
          if (buffer) {
            const result = await uploadBufferToCloudinary(buffer, 'dierashop/payments');
            updateData.paymentScreenshot = result.url;
            updateData.paymentScreenshotPublicId = result.publicId;
            updated = true;
          }
        } catch (err) {
          console.error(`Failed to migrate order ${o._id} payment:`, err.message);
        }
      }

      const items = o.items || [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (isDataUri(item.productImage)) {
          try {
            const buffer = dataUriToBuffer(item.productImage);
            if (buffer) {
              const result = await uploadBufferToCloudinary(buffer, 'dierashop/order-items');
              if (!updateData.items) updateData.items = [...items];
              updateData.items[i] = {
                ...updateData.items[i],
                productImage: result.url,
                productImagePublicId: result.publicId,
              };
              updated = true;
            }
          } catch (err) {
            console.error(`Failed to migrate order ${o._id} item ${i}:`, err.message);
          }
        }
      }

      if (updated) {
        await Order.findByIdAndUpdate(o._id, updateData);
        migrated++;
      }
    }

    page++;
    console.log(`[Orders] Migrated page ${page}`);
  }

  console.log(`[Orders] Total migrated: ${migrated}`);
  return migrated;
};

const migrateChatMessages = async () => {
  let migrated = 0;
  let page = 0;
  const batchSize = 50;

  while (true) {
    const messages = await ChatMessage.find()
      .skip(page * batchSize)
      .limit(batchSize)
      .lean();

    if (messages.length === 0) break;

    for (const m of messages) {
      if (!isDataUri(m.fileData)) continue;

      try {
        const buffer = dataUriToBuffer(m.fileData);
        if (!buffer) continue;
        const result = await uploadBufferToCloudinary(buffer, 'dierashop/chat');
        await ChatMessage.findByIdAndUpdate(m._id, {
          fileData: result.url,
          filePublicId: result.publicId,
        });
        migrated++;
      } catch (err) {
        console.error(`Failed to migrate chat message ${m._id}:`, err.message);
      }
    }

    page++;
    console.log(`[ChatMessages] Migrated page ${page}`);
  }

  console.log(`[ChatMessages] Total migrated: ${migrated}`);
  return migrated;
};

const diagnose = async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'dierashop' });
  console.log('Connected to MongoDB for diagnosis');

  const collections = [
    { model: Product, field: 'images', label: 'Products' },
    { model: Category, field: 'imageUrl', label: 'Categories' },
    { model: SiteImage, field: 'imageData', label: 'SiteImages' },
    { model: Review, field: 'images', label: 'Reviews' },
    { model: User, field: 'avatarUrl', label: 'Users' },
    { model: Order, field: 'paymentScreenshot', label: 'Orders' },
    { model: ChatMessage, field: 'fileData', label: 'ChatMessages' },
  ];

  for (const { model, field, label } of collections) {
    const total = await model.countDocuments();
    const withValues = await model.countDocuments({ [field]: { $ne: null } });
    const base64Count = await model.countDocuments({ [field]: { $regex: '^data:image/', $options: 'i' } });
    console.log(`[${label}] total=${total} withValues=${withValues} base64Pattern=${base64Count}`);

    const samples = await model.find({ [field]: { $ne: null } }).limit(2).lean();
    for (const doc of samples) {
      const value = doc[field];
      if (Array.isArray(value)) {
        console.log(`[${label}][sample] ${doc._id}: array.length=${value.length}, first=${String(value[0] || '').slice(0, 80)}`);
      } else {
        console.log(`[${label}][sample] ${doc._id}: ${String(value || '').slice(0, 80)}`);
      }
    }
    console.log('');
  }

  await mongoose.disconnect();
  console.log('Diagnosis complete');
  process.exit(0);
};

const runMigration = async () => {
  console.log('Starting Cloudinary migration...');

  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'dierashop' });
  console.log('Connected to MongoDB');

  console.log('\n=== Migrating Products ===');
  await migrateProducts();

  console.log('\n=== Migrating Categories ===');
  await migrateCategories();

  console.log('\n=== Migrating SiteImages ===');
  await migrateSiteImages();

  console.log('\n=== Migrating Reviews ===');
  await migrateReviews();

  console.log('\n=== Migrating Users ===');
  await migrateUsers();

  console.log('\n=== Migrating Orders ===');
  await migrateOrders();

  console.log('\n=== Migrating ChatMessages ===');
  await migrateChatMessages();

  await mongoose.disconnect();
  console.log('\nMigration complete!');
};

const mode = process.argv[2];
if (mode === 'diagnose') {
  await diagnose();
} else {
  await runMigration();
}
