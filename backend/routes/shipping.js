import express from 'express';
import ShippingRate from '../models/ShippingRate.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/** GET /api/shipping-rates — public, returns all rates */
router.get('/', async (req, res) => {
  try {
    const rates = await ShippingRate.find().sort({ province: 1, district: 1 });
    res.json(rates);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch shipping rates' });
  }
});

/**
 * GET /api/shipping-rates/calculate?province=X&district=Y
 * Returns the applicable fee for a given province+district.
 * District rate takes priority over province rate.
 * Falls back to 0 if no rate is configured.
 */
router.get('/calculate', async (req, res) => {
  try {
    const { province, district } = req.query;
    if (!province) return res.status(400).json({ error: 'province is required' });

    // Try district-level first
    if (district) {
      const districtRate = await ShippingRate.findOne({ province, district });
      if (districtRate) return res.json({ fee: districtRate.fee, level: 'district' });
    }

    // Fall back to province-level
    const provinceRate = await ShippingRate.findOne({ province, district: null });
    if (provinceRate) return res.json({ fee: provinceRate.fee, level: 'province' });

    // No rate configured
    res.json({ fee: 0, level: 'none' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate shipping' });
  }
});

/** PUT /api/shipping-rates — admin only, upsert a single rate */
router.put('/', requireAdmin, async (req, res) => {
  try {
    const { province, district, fee } = req.body;
    if (!province || fee === undefined || fee === null) {
      return res.status(400).json({ error: 'province and fee are required' });
    }

    const rate = await ShippingRate.findOneAndUpdate(
      { province, district: district || null },
      { fee: Number(fee) },
      { upsert: true, new: true }
    );
    res.json(rate);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save shipping rate' });
  }
});

/** DELETE /api/shipping-rates/:id — admin only */
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await ShippingRate.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete shipping rate' });
  }
});

export default router;
