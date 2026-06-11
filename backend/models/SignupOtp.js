import mongoose from 'mongoose';

const signupOtpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true },
    codeHash: { type: String, required: true },
    fullName: { type: String },
    passwordHash: { type: String },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    consumedAt: { type: Date },
  },
  { timestamps: true }
);

signupOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
signupOtpSchema.index({ email: 1, createdAt: -1 });

export default mongoose.model('SignupOtp', signupOtpSchema);
