const express = require('express');
const router = express.Router();
const { getProducts, getCategories, getProductById } = require('../controllers/productController');

router.get('/categories', getCategories);
router.get('/', getProducts);
router.get('/:id', getProductById);

module.exports = router;
