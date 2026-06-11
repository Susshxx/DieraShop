import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    question: { type: String, required: true, minlength: 3, maxlength: 1000 },
    answer: { type: String, default: '' },
    answeredAt: { type: Date },
    answeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Question', questionSchema);
