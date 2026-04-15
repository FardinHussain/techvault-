const express = require('express');
const router = express.Router();
// 1. Add getAllOrders to your imports
const { 
  createOrder, 
  getMyOrders, 
  getOrderById,
  getAllOrders // <--- Add this
} = require('../controllers/orderController');

// 2. Add 'admin' to your middleware imports
const { protect, admin } = require('../middleware/authMiddleware');

// ── ROUTES ──

// This handles GET /api/orders (For Admins) and POST /api/orders (For Users)
router.route('/')
  .post(protect, createOrder)
  .get(protect, admin, getAllOrders); // <--- THIS WAS MISSING

router.get('/myorders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);

module.exports = router;
