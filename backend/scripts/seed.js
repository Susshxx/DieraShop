import 'dotenv/config';
import mongoose from 'mongoose';
import SiteImage from '../models/SiteImage.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

const slots = [
  { slotKey: 'home_hero', title: 'Effortless Elegance', subtitle: 'Curated clothing for the modern Nepali woman', sortOrder: 0, imageData: null },
  { slotKey: 'home_mid_banner_left', title: 'Mid Banner Left', subtitle: 'Left side promotional image (1/3 width)', sortOrder: 1, imageData: null },
  { slotKey: 'home_mid_banner_right', title: 'Mid Banner Right', subtitle: 'Right side promotional image (2/3 width)', sortOrder: 2, imageData: null },
  { slotKey: 'home_collection_boots', title: 'Boots Collection', subtitle: 'Stylish footwear', sortOrder: 3, imageData: null },
  { slotKey: 'home_collection_hoodie', title: 'Hoodie Collection', subtitle: 'Cozy comfort', sortOrder: 4, imageData: null },
  { slotKey: 'home_collection_shoes', title: 'Shoes Collection', subtitle: 'Step in style', sortOrder: 5, imageData: null },
  { slotKey: 'home_collection_trousers', title: 'Trousers Collection', subtitle: 'Smart casual', sortOrder: 6, imageData: null },
  { slotKey: 'home_collection_tshirts', title: 'Tshirts Collection', subtitle: 'Everyday basics', sortOrder: 7, imageData: null },
  { slotKey: 'home_collection_dresses', title: 'Dresses Collection', subtitle: 'Modern style', sortOrder: 8, imageData: null },
  { slotKey: 'home_collection_accessories', title: 'Accessories Collection', subtitle: 'Complete your look', sortOrder: 9, imageData: null },
];

const categories = [
  { name: 'Boots', slug: 'boots', sortOrder: 0 },
  { name: 'Hoodie', slug: 'hoodie', sortOrder: 1 },
  { name: 'Shoes', slug: 'shoes', sortOrder: 2 },
  { name: 'Trousers', slug: 'trousers', sortOrder: 3 },
  { name: 'Tshirts', slug: 'tshirts', sortOrder: 4 },
  { name: 'Dresses', slug: 'dresses', sortOrder: 5 },
  { name: 'Accessories', slug: 'accessories', sortOrder: 6 },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  for (const slot of slots) {
    await SiteImage.findOneAndUpdate({ slotKey: slot.slotKey }, slot, { upsert: true });
  }
  console.log('Site images seeded');

  const catIds = {};
  for (const cat of categories) {
    const doc = await Category.findOneAndUpdate({ slug: cat.slug }, cat, { upsert: true, new: true });
    catIds[cat.slug] = doc._id;
  }
  console.log('Categories seeded');

  // No product seeding - products should be added manually via admin panel
  console.log('Skipping product seeding (add products via admin panel)');

  await mongoose.disconnect();
  console.log('Done');
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
