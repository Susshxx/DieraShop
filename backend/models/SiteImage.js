import mongoose from 'mongoose';

const siteImageSchema = new mongoose.Schema(
  {
    slotKey: { type: String, required: true, unique: true },
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    alt: { type: String, default: '' },
    link: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
    imageData: { type: String, default: null },
    imagePublicId: { type: String, default: '' },
    imageMimeType: { type: String, default: '' },
    imageSize: { type: Number, default: 0 },
    uploadedAt: { type: Date },
    sourceType: { type: String, enum: ['local_upload', 'url_drag_drop', ''], default: '' },
    sourceUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('SiteImage', siteImageSchema);
