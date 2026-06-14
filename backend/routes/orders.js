import { Router } from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { sendEmail, orderEmailHtml } from '../utils/email.js';

const router = Router();
const adminRouter = Router();

const mapOrder = (o) => ({
  id: o._id,
  _id: o._id,
  user_id: o.userId?._id || o.userId,
  userId: o.userId?._id || o.userId,
  total_npr: o.totalNPR,
  totalNPR: o.totalNPR,
  status: o.status,
  payment_method: o.paymentMethod,
  paymentMethod: o.paymentMethod,
  paymentScreenshot: o.paymentScreenshot,
  shipping_address: o.shippingAddress,
  shippingAddress: o.shippingAddress,
  phone: o.phone,
  full_name: o.fullName,
  fullName: o.fullName,
  notes: o.notes,
  created_at: o.createdAt,
  updated_at: o.updatedAt,
  order_items: (o.items || []).map((i) => ({
    id: i._id,
    product_id: i.productId,
    product_name: i.productName,
    product_image: i.productImage,
    category_name: i.categoryName,
    qty: i.qty,
    size: i.size,
    color: i.color,
    price_npr: i.priceNPR,
  })),
  profiles: o.userId && typeof o.userId === 'object' ? { full_name: o.userId.name, phone: o.userId.phone } : undefined,
});

const emitNotification = (io, userId, payload) => {
  if (io) io.to(`user:${userId}`).emit('notification:new', payload);
};

router.post('/create', verifyToken, async (req, res) => {
  try {
    const { items, shippingAddress, phone, fullName, paymentMethod, paymentScreenshot, totalNPR, notes } = req.body;
    if (!items?.length) return res.status(400).json({ error: 'Cart is empty' });

    // Validate stock availability for each item
    for (const item of items) {
      const product = await Product.findById(item.productId || item.product_id);
      if (!product) {
        return res.status(400).json({ error: `Product not found: ${item.productName || item.name}` });
      }

      const requestedQty = item.qty || item.quantity;
      const size = item.size || null;
      const color = item.color || null;

      // Build variant key (e.g. "S-Black") when size/color are present
      let availableStock;
      if (size || color) {
        const variantKey = [size, color].filter(Boolean).join('-');
        const variantQty = product.variantStock?.get(variantKey);
        if (variantQty !== undefined) {
          availableStock = variantQty;
        } else {
          // Fallback: sum variantStock entries that match the provided size/color partially
          availableStock = product.stock;
        }
      } else {
        availableStock = product.stock;
      }

      if (availableStock < requestedQty) {
        return res.status(400).json({
          error: `Insufficient stock for ${product.name}${size ? ` (${size})` : ''}${color ? ` / ${color}` : ''}. Available: ${availableStock}, Requested: ${requestedQty}`,
        });
      }
    }

    const status = paymentMethod === 'phonepay' ? 'awaiting_payment' : 'pending';

    const order = await Order.create({
      userId: req.user.id,
      items: items.map((i) => ({
        productId: i.productId || i.product_id,
        productName: i.productName || i.product_name || i.name,
        productImage: i.image || i.productImage,
        categoryName: i.categoryName || i.category_name || i.category,
        qty: i.qty || i.quantity,
        size: i.size,
        color: i.color,
        priceNPR: i.priceNPR || i.price_npr || i.price,
      })),
      shippingAddress,
      phone,
      fullName,
      paymentMethod: paymentMethod || 'cod',
      paymentScreenshot: paymentScreenshot || undefined,
      totalNPR,
      notes: notes || '',
      status,
    });

    const user = await User.findById(req.user.id);
    const notif = await Notification.create({
      userId: req.user.id,
      type: 'order',
      title: 'Order placed!',
      body: `Your order #${order._id.toString().slice(-8)} for रू ${totalNPR} has been received.`,
      link: '/account/orders',
      orderId: order._id,
    });

    const io = req.app.get('io');
    emitNotification(io, req.user.id, notif);

    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: 'Diera Shop — Order Confirmation',
        html: orderEmailHtml({ orderId: order._id.toString(), total: totalNPR, status }),
        templateParams: {
          order_id: order._id.toString().slice(-8),
          total_npr: String(totalNPR),
          order_status: status,
        },
      });
    }

    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      const adminNotif = await Notification.create({
        userId: admin._id,
        type: 'order',
        title: 'New order received',
        body: `Order #${order._id.toString().slice(-8)} — रू ${totalNPR}`,
        link: '/admin/orders',
        orderId: order._id,
      });
      emitNotification(io, admin._id.toString(), adminNotif);
    }

    res.status(201).json({ order: mapOrder(order) });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

router.post('/esewa/verify', verifyToken, async (req, res) => {
  try {
    const { data, orderId } = req.body;
    
    if (!data || !orderId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Decode base64 data from eSewa
    const decodedData = Buffer.from(data, 'base64').toString('utf-8');
    const jsonData = JSON.parse(decodedData);

    // Verify transaction status
    if (jsonData.status !== 'COMPLETE' || !jsonData.transaction_code) {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Update order status
    const order = await Order.findByIdAndUpdate(
      orderId,
      { 
        status: 'pending',
        paidAt: new Date(),
        revenueRecorded: true,
        'paymentDetails.transactionId': jsonData.transaction_code,
        'paymentDetails.method': 'esewa',
        'paymentDetails.status': 'completed',
      },
      { new: true }
    ).populate('userId', 'email name');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Send notification to user
    const notif = await Notification.create({
      userId: order.userId._id || order.userId,
      title: 'Payment Successful',
      message: `Your payment of रू ${order.totalNPR} via eSewa has been confirmed.`,
      type: 'order',
      link: `/account/orders`,
    });

    // Emit real-time notification if available
    const io = req.app.get('io');
    if (io) {
      emitNotification(io, (order.userId._id || order.userId).toString(), notif);
    }

    // Send email confirmation
    if (order.userId?.email) {
      await sendEmail({
        to: order.userId.email,
        subject: 'Diera Shop — Payment Confirmed',
        html: orderEmailHtml({ orderId: order._id.toString(), total: order.totalNPR, status: 'pending' }),
        templateParams: {
          order_id: order._id.toString().slice(-8),
          total_npr: String(order.totalNPR),
          order_status: 'Payment confirmed',
        },
      });
    }

    res.json({ ok: true, order: mapOrder(order) });
  } catch (error) {
    console.error('eSewa verification error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

router.get('/mine', verifyToken, async (req, res) => {
  const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(orders.map(mapOrder));
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Check ownership
    if (String(order.userId) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Only allow cancel if order is pending or awaiting payment
    if (!['pending', 'awaiting_payment'].includes(order.status)) {
      return res.status(400).json({ error: 'Cannot cancel an order that has already been confirmed or processed' });
    }

    await Order.findByIdAndDelete(req.params.id);

    // Notifications — non-blocking: don't let a notification failure abort the cancel
    try {
      const notif = await Notification.create({
        userId: req.user.id,
        type: 'order',
        title: 'Order cancelled',
        body: `Your order #${order._id.toString().slice(-8)} has been cancelled.`,
        link: '/account/orders',
        orderId: order._id,
      });
      const io = req.app.get('io');
      emitNotification(io, req.user.id, notif);

      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        const adminNotif = await Notification.create({
          userId: admin._id,
          type: 'order',
          title: 'Order cancelled by user',
          body: `Order #${order._id.toString().slice(-8)} was cancelled by the customer.`,
          link: '/admin/orders',
          orderId: order._id,
        });
        emitNotification(io, admin._id.toString(), adminNotif);
      }
    } catch (notifErr) {
      console.error('Notification error (non-fatal):', notifErr);
    }

    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

adminRouter.get('/', verifyToken, requireAdmin, async (_req, res) => {
  const orders = await Order.find().populate('userId', 'name phone email').sort({ createdAt: -1 });
  const mapped = orders.map(o => {
    const base = mapOrder(o);
    // Add email to profiles if available
    if (o.userId?.email) {
      base.profiles = { ...base.profiles, email: o.userId.email };
    }
    return base;
  });
  res.json(mapped);
});

adminRouter.patch('/:id/status', verifyToken, requireAdmin, async (req, res) => {
  const { status } = req.body;
  
  // Get current order before updating
  const currentOrder = await Order.findById(req.params.id);
  if (!currentOrder) return res.status(404).json({ error: 'Not found' });
  
  // Check if we're moving from pending/awaiting_payment to confirmed
  const wasNotConfirmed = ['pending', 'awaiting_payment'].includes(currentOrder.status);
  const isNowConfirmed = status === 'confirmed';
  
  // Decrease stock if order is being confirmed for the first time
  if (wasNotConfirmed && isNowConfirmed) {
    for (const item of currentOrder.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        const newStock = Math.max(0, product.stock - item.qty);
        await Product.findByIdAndUpdate(item.productId, { stock: newStock });
      }
    }
  }
  
  // Prepare update object
  const updateData = { status };
  
  // If order is being marked as delivered and payment method is COD, record revenue
  if (status === 'delivered' && currentOrder.paymentMethod === 'cod' && !currentOrder.revenueRecorded) {
    updateData.paidAt = new Date();
    updateData.revenueRecorded = true;
  }
  
  const order = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('userId', 'email name');
  if (!order) return res.status(404).json({ error: 'Not found' });

  const notif = await Notification.create({
    userId: order.userId._id || order.userId,
    type: 'order',
    title: 'Order status updated',
    body: `Your order is now: ${status}`,
    link: '/account/orders',
  });

  const io = req.app.get('io');
  emitNotification(io, (order.userId._id || order.userId).toString(), notif);

  if (order.userId?.email) {
    await sendEmail({
      to: order.userId.email,
      subject: 'Diera Shop — Order Update',
      html: orderEmailHtml({ orderId: order._id.toString(), total: order.totalNPR, status }),
      templateParams: {
        order_id: order._id.toString().slice(-8),
        total_npr: String(order.totalNPR),
        order_status: status,
      },
    });
  }

  res.json(mapOrder(order));
});

adminRouter.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    // Only allow deletion if order is pending or awaiting payment
    if (!['pending', 'awaiting_payment'].includes(order.status)) {
      return res.status(400).json({ error: 'Cannot delete order that has been confirmed or processed' });
    }
    
    const userId = order.userId;
    await Order.findByIdAndDelete(req.params.id);
    
    // Send notification to user
    const notif = await Notification.create({
      userId: userId,
      type: 'order',
      title: 'Order deleted',
      body: `Your order #${order._id.toString().slice(-8)} has been deleted by admin.`,
      link: '/account/orders',
      orderId: order._id,
    });
    
    const io = req.app.get('io');
    emitNotification(io, userId.toString(), notif);
    
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

export { router as default, adminRouter };
