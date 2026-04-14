const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { getConnectionStatus } = require('../config/db');

const DB_OFFLINE_MSG = { message: 'Database offline' };

// POST /api/orders
const createOrder = async (req, res) => {
  try {
    if (!getConnectionStatus()) return res.status(503).json(DB_OFFLINE_MSG);
    const { items, shippingAddress, paymentMethod } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: 'Order must contain at least one item' });

    const sa = shippingAddress || {};
    if (!sa.fullName || !sa.address || !sa.city || !sa.state || !sa.pincode || !sa.country)
      return res.status(400).json({ message: 'Complete shipping address is required' });

    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      if (!item.product || !item.quantity || item.quantity < 1)
        return res.status(400).json({ message: 'Each item needs a valid product ID and quantity' });

      let title = item.title || 'Product';
      let price = item.price || 0;
      let thumbnail = item.thumbnail || '';

      try {
        const prod = await Product.findById(item.product);
        if (prod) {
          title = prod.title;
          price = prod.price;
          thumbnail = prod.thumbnail;
        }
      } catch { /* product lookup failed, use client values */ }

      subtotal += price * item.quantity;
      orderItems.push({ product: item.product, title, thumbnail, price, quantity: item.quantity });
    }

    const shippingCost = subtotal >= 50 ? 0 : 5.99;
    const discount = 0;
    const total = parseFloat((subtotal + shippingCost - discount).toFixed(2));

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress: sa,
      paymentMethod: paymentMethod || 'Cash on Delivery',
      subtotal: parseFloat(subtotal.toFixed(2)),
      discount,
      shippingCost,
      total,
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/orders/myorders
const getMyOrders = async (req, res) => {
  try {
    if (!getConnectionStatus()) return res.status(503).json(DB_OFFLINE_MSG);
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/orders/:id
const getOrderById = async (req, res) => {
  try {
    if (!getConnectionStatus()) return res.status(503).json(DB_OFFLINE_MSG);
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const ownerId = order.user._id ? order.user._id.toString() : order.user.toString();
    if (ownerId !== req.user._id.toString() && !req.user.isAdmin)
      return res.status(403).json({ message: 'Not authorized to view this order' });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/orders
const getAllOrders = async (req, res) => {
  try {
    if (!getConnectionStatus()) return res.status(503).json(DB_OFFLINE_MSG);
    const orders = await Order.find({}).populate('user', 'name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/admin/orders/:id/status
const updateOrderStatus = async (req, res) => {
  try {
    if (!getConnectionStatus()) return res.status(503).json(DB_OFFLINE_MSG);
    const { status } = req.body;
    const allowed = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!status || !allowed.includes(status))
      return res.status(400).json({ message: `Status must be one of: ${allowed.join(', ')}` });

    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    if (!getConnectionStatus()) return res.status(503).json(DB_OFFLINE_MSG);
    const totalOrders = await Order.countDocuments();
    const revAgg = await Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]);
    const totalRevenue = revAgg[0]?.total || 0;
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments();
    res.json({ totalOrders, totalRevenue, totalProducts, totalUsers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus, getStats };
