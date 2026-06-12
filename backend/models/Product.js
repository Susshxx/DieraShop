import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    priceNPR: { type: Number, required: true, default: 0 },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    stock: { type: Number, default: 0 }, // Overall stock (kept for backward compatibility)
    images: [{ type: String }],
    sizes: [{ type: String }],
    colors: [{ type: String }],
    // New field: maps color to image index
    colorImageMap: { type: Map, of: Number, default: {} },
    // Variant-specific stock: { "S-Pink": 10, "M-Pink": 5, "L-White": 8 }
    variantStock: { type: Map, of: Number, default: {} },
    tags: [{ type: String }],
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', tags: 'text' });

export default mongoose.model('Product', productSchema);
