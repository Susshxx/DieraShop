import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatConversation', required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['user', 'admin'], required: true },
    text: { type: String, default: '', maxlength: 2000 },
    messageType: { type: String, enum: ['text', 'image', 'audio'], default: 'text' },
    fileData: { type: String }, // Base64 encoded file data
    filePublicId: { type: String },
    fileName: { type: String },
    fileSize: { type: Number },
    mimeType: { type: String },
    readAt: { type: Date },
  },
  { timestamps: true }
);

chatMessageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.model('ChatMessage', chatMessageSchema);
