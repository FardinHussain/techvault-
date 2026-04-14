const Review = require('../models/Review');
const Product = require('../models/Product');
const { getConnectionStatus } = require('../config/db');

const DB_OFFLINE_MSG = { message: 'Database offline' };

// POST /api/reviews/:productId
const addReview = async (req, res) => {
  try {
    if (!getConnectionStatus()) return res.status(503).json(DB_OFFLINE_MSG);
    const { rating, comment } = req.body;
    const { productId } = req.params;

    if (!rating) return res.status(400).json({ message: 'Rating is required' });
    if (!comment || !comment.trim()) return res.status(400).json({ message: 'Review comment is required' });
    const r = Number(rating);
    if (isNaN(r) || r < 1 || r > 5) return res.status(400).json({ message: 'Rating must be between 1 and 5' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const existing = await Review.findOne({ product: productId, user: req.user._id });
    if (existing) return res.status(400).json({ message: 'You have already reviewed this product' });

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      userName: req.user.name,
      rating: r,
      comment: comment.trim(),
    });

    const allReviews = await Review.find({ product: productId });
    const avgRating = allReviews.reduce((acc, rv) => acc + rv.rating, 0) / allReviews.length;
    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(avgRating * 10) / 10,
      numReviews: allReviews.length,
    });

    res.status(201).json(review);
  } catch (error) {
    if (error.code === 11000)
      return res.status(400).json({ message: 'You have already reviewed this product' });
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reviews/:productId
const getProductReviews = async (req, res) => {
  try {
    if (!getConnectionStatus()) return res.status(503).json(DB_OFFLINE_MSG);
    const reviews = await Review.find({ product: req.params.productId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addReview, getProductReviews };
