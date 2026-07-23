import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    imageUrl: { type: String, default: '' },
    imagePublicId: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
    showInHeader: { type: Boolean, default: true },
    showInFooter: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Category', categorySchema);
