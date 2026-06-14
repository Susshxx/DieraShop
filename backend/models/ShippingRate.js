import mongoose from 'mongoose';

/**
 * ShippingRate schema.
 * Supports two levels:
 *   1. Province-level: { province: "Bagmati Province", fee: 150 }
 *   2. District-level override: { province: "Bagmati Province", district: "Kathmandu", fee: 100 }
 * When calculating shipping, district-level takes priority over province-level.
 */
const shippingRateSchema = new mongoose.Schema(
  {
    province: { type: String, required: true },
    district: { type: String, default: null }, // null = applies to entire province
    fee: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

// Composite unique index: one rate per province, one rate per province+district pair
shippingRateSchema.index({ province: 1, district: 1 }, { unique: true });

export default mongoose.model('ShippingRate', shippingRateSchema);
