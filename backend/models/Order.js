import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, required: true },
  productImage: { type: String },
  categoryName: { type: String },
  qty: { type: Number, required: true, min: 1 },
  size: { type: String },
  color: { type: String },
  priceNPR: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    shippingAddress: { type: String, required: true },
    phone: { type: String, required: true },
    fullName: { type: String, required: true },
    notes: { type: String, default: '' },
    paymentMethod: { type: String, enum: ['cod', 'khalti', 'esewa'], default: 'cod' },
    paymentDetails: {
      transactionId: { type: String },
      method: { type: String },
      status: { type: String },
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'awaiting_payment'],
      default: 'pending',
    },
    totalNPR: { type: Number, required: true },
    paidAt: { type: Date },
    revenueRecorded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
