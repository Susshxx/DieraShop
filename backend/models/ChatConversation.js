import mongoose from 'mongoose';

const chatConversationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now },
    unreadAdmin: { type: Number, default: 0 },
    unreadUser: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('ChatConversation', chatConversationSchema);
