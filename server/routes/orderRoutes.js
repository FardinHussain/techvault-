const express = require('express');
const router = express.Router();

const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  getStats,
} = require('../controllers/orderController');

const { protect, admin } = require('../middleware/authMiddleware');

// ── IMPORTANT: Static/specific routes MUST come before /:id ──
// If /:id is first, it swallows /stats and /myorders

// User routes
router.post('/', protect, createOrder);
router.get('/myorders', protect, getMyOrders);

// Admin routes — defined BEFORE /:id so they aren't swallowed
router.get('/stats', protect, admin, getStats);
router.get('/all', protect, admin, getAllOrders);
router.put('/:id/status', protect, admin, updateOrderStatus);

// Dynamic route LAST — catches /:id only after all statics above
router.get('/:id', protect, getOrderById);

module.exports = router;
