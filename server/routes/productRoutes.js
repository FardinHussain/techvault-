const express = require('express');
const router = express.Router();
const {
  getProducts,
  getCategories,
  getProductById,
  deleteProduct,
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

// Static routes first
router.get('/categories', getCategories);
router.get('/', getProducts);

// Admin delete — protected
router.delete('/:id', protect, admin, deleteProduct);

// Dynamic last
router.get('/:id', getProductById);

module.exports = router;
