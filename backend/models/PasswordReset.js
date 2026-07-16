import { Schema, model } from 'mongoose';

const passwordResetSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    consumedAt: { type: Date, default: null },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Index for cleanup
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 }); // Auto-delete 1 hour after expiry

export default model('PasswordReset', passwordResetSchema);
