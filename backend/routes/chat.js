import { Router } from 'express';
import ChatConversation from '../models/ChatConversation.js';
import ChatMessage from '../models/ChatMessage.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { memoryUpload } from '../middleware/upload.js';
import { bufferToDataUri } from '../utils/imageProcessor.js';

const router = Router();
const adminRouter = Router();

const mapConv = (c) => ({
  id: c._id,
  _id: c._id,
  user_id: c.userId?._id || c.userId,
  last_message: c.lastMessage,
  last_message_at: c.lastMessageAt,
  unread_admin: c.unreadAdmin,
  unread_user: c.unreadUser,
  profiles: c.userId && typeof c.userId === 'object' ? { full_name: c.userId.name } : undefined,
});

const mapMsg = (m) => ({
  id: m._id,
  _id: m._id,
  conversation_id: m.conversationId,
  sender_id: m.senderId,
  sender_role: m.senderRole,
  body: m.text,
  text: m.text,
  message_type: m.messageType,
  messageType: m.messageType,
  file_data: m.fileData,
  fileData: m.fileData,
  file_name: m.fileName,
  fileName: m.fileName,
  mime_type: m.mimeType,
  mimeType: m.mimeType,
  created_at: m.createdAt,
  read_at: m.readAt,
});

const getOrCreateConversation = async (userId) => {
  let conv = await ChatConversation.findOne({ userId });
  if (!conv) conv = await ChatConversation.create({ userId });
  return conv;
};

router.get('/conversation', verifyToken, async (req, res) => {
  const conv = await getOrCreateConversation(req.user.id);
  res.json(mapConv(conv));
});

router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    const conv = await ChatConversation.findOne({ userId: req.user.id });
    const unread_count = conv ? (conv.unreadUser || 0) : 0;
    res.json({ unread_count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

router.get('/conversation/:id/messages', verifyToken, async (req, res) => {
  try {
    const conv = await ChatConversation.findById(req.params.id);
    if (!conv) return res.status(404).json({ error: 'Not found' });
    if (conv.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const messages = await ChatMessage.find({ conversationId: conv._id }).sort({ createdAt: 1 });
    res.json(messages.map(mapMsg));
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/conversation/:id/messages', verifyToken, memoryUpload.single('file'), async (req, res) => {
  try {
    const { body } = req.body;
    const file = req.file;
    
    const conv = await ChatConversation.findById(req.params.id);
    if (!conv) return res.status(404).json({ error: 'Not found' });

    const isAdmin = req.user.role === 'admin';
    if (conv.userId.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const senderRole = isAdmin ? 'admin' : 'user';
    
    let messageData = {
      conversationId: conv._id,
      senderId: req.user.id,
      senderRole,
      text: body || '',
      messageType: 'text',
    };

    // Handle file upload (images only)
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ error: 'File too large. Max 5MB.' });
      }

      const mimeType = file.mimetype;
      
      if (!mimeType.startsWith('image/')) {
        return res.status(400).json({ error: 'Only image files are supported' });
      }

      // Convert to base64 data URI
      const dataUri = bufferToDataUri(file.buffer, mimeType);

      messageData = {
        ...messageData,
        messageType: 'image',
        fileData: dataUri,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType,
      };
    }

    const msg = await ChatMessage.create(messageData);

    // Update conversation with last message preview
    const lastMessageText = messageData.messageType === 'text' ? body : '📷 Image';
      
    conv.lastMessage = lastMessageText;
    conv.lastMessageAt = new Date();
    if (isAdmin) conv.unreadUser += 1;
    else conv.unreadAdmin += 1;
    await conv.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${conv._id}`).emit('chat_messages', mapMsg(msg));
    }

    // Don't send any notifications for chat messages
    // Users and admins should check the chat section directly

    res.status(201).json(mapMsg(msg));
  } catch (error) {
    console.error('Error posting message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

adminRouter.get('/conversations', verifyToken, requireAdmin, async (_req, res) => {
  // Only get conversations that have at least one message (lastMessage is not null/empty)
  const convs = await ChatConversation.find({ 
    lastMessage: { $exists: true, $ne: null, $ne: '' } 
  }).populate('userId', 'name').sort({ lastMessageAt: -1 });
  res.json(convs.map(mapConv));
});

export { router as default, adminRouter };
