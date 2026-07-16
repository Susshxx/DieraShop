import 'dotenv/config';
import mongoose from 'mongoose';
import Product from '../models/Product.js';

/**
 * Build database indexes for optimal query performance
 * Run this script after deployment or schema changes
 */

async function buildIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dierashop', {
      dbName: 'dierashop',
    });
    console.log('✓ Connected to MongoDB\n');

    console.log('Building indexes for Product collection...');
    await Product.syncIndexes();
    console.log('✓ Product indexes created successfully\n');

    const indexes = await Product.collection.getIndexes();
    console.log('Current indexes:');
    Object.keys(indexes).forEach((indexName) => {
      console.log(`  - ${indexName}`);
    });

    console.log('\n✅ All indexes built successfully!');
    console.log('Your product queries will now be much faster.\n');
  } catch (error) {
    console.error('❌ Error building indexes:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

buildIndexes();
