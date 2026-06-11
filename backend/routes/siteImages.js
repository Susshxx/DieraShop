import { Router } from 'express';
import SiteImage from '../models/SiteImage.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { memoryUpload } from '../middleware/upload.js';
import { processImageToWebp, bufferToDataUri } from '../utils/imageProcessor.js';
import { isPublicImageUrl } from '../utils/urlValidator.js';

const router = Router();
const adminRouter = Router();

const mapSlot = (s) => ({
  id: s._id,
  slot_key: s.slotKey,
  slotKey: s.slotKey,
  title: s.title,
  subtitle: s.subtitle,
  alt: s.alt,
  link: s.link,
  sort_order: s.sortOrder,
  image_data: s.imageData,
  imageData: s.imageData,
  image_url: s.imageData,
  imageUrl: s.imageData,
  uploaded_at: s.uploadedAt,
  updated_at: s.updatedAt,
});

router.get('/', async (_req, res) => {
  const slots = await SiteImage.find().sort({ sortOrder: 1 });
  res.json(slots.map(mapSlot));
});

router.get('/:slotKey', async (req, res) => {
  const slot = await SiteImage.findOne({ slotKey: req.params.slotKey });
  if (!slot) return res.status(404).json({ error: 'Not found' });
  res.json(mapSlot(slot));
});

adminRouter.get('/', verifyToken, requireAdmin, async (_req, res) => {
  const slots = await SiteImage.find().sort({ sortOrder: 1 });
  res.json(slots.map(mapSlot));
});

adminRouter.patch('/:slotKey', verifyToken, requireAdmin, async (req, res) => {
  const { title, subtitle, alt, link, sortOrder } = req.body;
  const slot = await SiteImage.findOneAndUpdate(
    { slotKey: req.params.slotKey },
    { title, subtitle, alt, link, sortOrder },
    { upsert: true, new: true }
  );
  res.json(mapSlot(slot));
});

const optionalUpload = (req, res, next) => {
  if (req.is('multipart/form-data')) {
    return memoryUpload.single('image')(req, res, next);
  }
  next();
};

adminRouter.post('/:slotKey/image', verifyToken, requireAdmin, optionalUpload, async (req, res) => {
  let buffer;
  let sourceType = 'local_upload';
  let sourceUrl = null;

  if (req.file) {
    buffer = req.file.buffer;
  } else if (req.body.url) {
    if (!isPublicImageUrl(req.body.url)) {
      return res.status(400).json({ error: 'Invalid or blocked URL' });
    }
    sourceType = 'url_drag_drop';
    sourceUrl = req.body.url;
    const response = await fetch(req.body.url);
    if (!response.ok) return res.status(400).json({ error: 'Failed to fetch image' });
    const ct = response.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return res.status(400).json({ error: 'URL is not an image' });
    buffer = Buffer.from(await response.arrayBuffer());
  } else {
    return res.status(400).json({ error: 'No image provided' });
  }

  const webpBuffer = await processImageToWebp(buffer);
  const base64 = bufferToDataUri(webpBuffer);

  const slot = await SiteImage.findOneAndUpdate(
    { slotKey: req.params.slotKey },
    {
      imageData: base64,
      imageMimeType: 'image/webp',
      imageSize: webpBuffer.byteLength,
      uploadedAt: new Date(),
      sourceType,
      sourceUrl,
    },
    { upsert: true, new: true }
  );

  res.json({ ok: true, slotKey: slot.slotKey, ...mapSlot(slot) });
});

adminRouter.post('/:slotKey/reset', verifyToken, requireAdmin, async (req, res) => {
  const slot = await SiteImage.findOneAndUpdate(
    { slotKey: req.params.slotKey },
    { imageData: null, imageMimeType: '', imageSize: 0, sourceType: '', sourceUrl: '' },
    { new: true }
  );
  res.json({ ok: true, ...mapSlot(slot) });
});

export { router as default, adminRouter };
