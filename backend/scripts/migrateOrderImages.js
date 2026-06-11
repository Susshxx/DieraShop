import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

dotenv.config();

const migrateOrderImages = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all orders
    const orders = await Order.find({});
    console.log(`Found ${orders.length} orders to process`);

    let updatedCount = 0;

    for (const order of orders) {
      let hasUpdates = false;

      for (const item of order.items) {
        // Skip if item already has image and category
        if (item.productImage && item.categoryName) continue;

        // Find the product
        const product = await Product.findById(item.productId);
        if (!product) {
          console.log(`Product not found for order item: ${item.productName}`);
          continue;
        }

        // Update image if missing
        if (!item.productImage && product.images && product.images.length > 0) {
          item.productImage = product.images[0];
          hasUpdates = true;
        }

        // Update category if missing
        if (!item.categoryName && product.categoryId) {
          const category = await Category.findById(product.categoryId);
          if (category) {
            item.categoryName = category.name;
            hasUpdates = true;
          }
        }
      }

      if (hasUpdates) {
        await order.save();
        updatedCount++;
      }
    }

    console.log(`✅ Migration complete! Updated ${updatedCount} orders`);
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrateOrderImages();
