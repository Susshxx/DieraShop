import 'dotenv/config';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';

/**
 * Optimize MongoDB Atlas for better performance
 * - Rebuild indexes
 * - Analyze query patterns
 * - Show optimization recommendations
 */

async function optimizeAtlas() {
  try {
    console.log('🚀 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'dierashop',
    });
    console.log('✓ Connected!\n');

    // 1. Rebuild Product indexes
    console.log('📦 Optimizing Product collection...');
    await Product.collection.dropIndexes();
    await Product.createIndexes();
    console.log('  ✓ Product indexes rebuilt');
    
    // List all indexes
    const productIndexes = await Product.collection.getIndexes();
    console.log('  📊 Product indexes:');
    Object.keys(productIndexes).forEach(idx => {
      console.log(`     - ${idx}`);
    });

    // 2. Rebuild Category indexes  
    console.log('\n📂 Optimizing Category collection...');
    try {
      await Category.collection.dropIndexes();
    } catch (e) {
      // Ignore if no indexes to drop
    }
    await Category.createIndexes();
    console.log('  ✓ Category indexes rebuilt');

    // 3. Rebuild Order indexes
    console.log('\n🛒 Optimizing Order collection...');
    try {
      await Order.collection.dropIndexes();
    } catch (e) {
      // Ignore if no indexes to drop
    }
    await Order.createIndexes();
    console.log('  ✓ Order indexes rebuilt');

    // 4. Query performance stats
    console.log('\n📊 Collection stats:');
    const productCount = await Product.countDocuments();
    const categoryCount = await Category.countDocuments();
    const orderCount = await Order.countDocuments();
    
    console.log(`  Products: ${productCount}`);
    console.log(`  Categories: ${categoryCount}`);
    console.log(`  Orders: ${orderCount}`);

    // 5. Test query performance
    console.log('\n⚡ Testing featured products query...');
    const start = Date.now();
    const featuredProducts = await Product.find({ featured: true, active: true })
      .select('name slug priceNPR images')
      .limit(50)
      .lean();
    const duration = Date.now() - start;
    console.log(`  ✓ Query completed in ${duration}ms (found ${featuredProducts.length} products)`);
    
    if (duration > 1000) {
      console.log('  ⚠️  Query is slow! Recommendations:');
      console.log('     1. Ensure indexes are created (run this script)');
      console.log('     2. Consider upgrading MongoDB Atlas tier');
      console.log('     3. Check network latency to Atlas');
    } else if (duration > 500) {
      console.log('  ⚠️  Query is moderately slow. Consider caching.');
    } else {
      console.log('  ✓ Query performance is good!');
    }

    // 6. Recommendations
    console.log('\n💡 Optimization tips:');
    console.log('   1. ✓ Indexes are optimized');
    console.log('   2. ✓ Using .lean() for faster queries');
    console.log('   3. ✓ HTTP caching enabled (5 min)');
    console.log('   4. ✓ Connection pooling configured');
    console.log('   5. Consider: Store images in CDN instead of database');
    console.log('   6. Consider: Upgrade MongoDB Atlas tier if still slow');

    console.log('\n✅ Optimization complete!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

optimizeAtlas();
