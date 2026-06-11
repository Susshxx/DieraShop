import 'dotenv/config';
import mongoose from 'mongoose';
import SiteImage from '../models/SiteImage.js';

const collectionsToRemove = [
  'home_collection_rings',
  'home_collection_earrings',
  'home_collection_bracelets',
  'home_collection_necklaces'
];

async function cleanup() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  console.log('Removing old jewelry collection site images...');
  const result = await SiteImage.deleteMany({
    slotKey: { $in: collectionsToRemove }
  });
  
  console.log(`✓ Removed ${result.deletedCount} old collection entries`);

  await mongoose.disconnect();
  console.log('Done! Old jewelry collections have been removed.');
}

cleanup().catch((e) => {
  console.error('Error during cleanup:', e);
  process.exit(1);
});
