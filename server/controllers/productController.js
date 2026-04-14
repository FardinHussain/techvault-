const Product = require('../models/Product');
const { getConnectionStatus } = require('../config/db');
const fs = require('fs');
const path = require('path');

const DB_OFFLINE_MSG = { message: 'Database offline' };

const readFallback = () => {
  try {
    const fp = path.join(__dirname, '../data/products.json');
    return JSON.parse(fs.readFileSync(fp, 'utf8'));
  } catch {
    return [];
  }
};

// GET /api/products
const getProducts = async (req, res) => {
  try {
    const { category, search, sort, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    if (!getConnectionStatus()) {
      // Fallback to JSON
      let all = readFallback();
      if (category) all = all.filter(p => p.category && p.category.toLowerCase() === category.toLowerCase());
      if (search) {
        const s = search.toLowerCase();
        all = all.filter(p =>
          (p.title || '').toLowerCase().includes(s) ||
          (p.brand || '').toLowerCase().includes(s)
        );
      }
      if (sort === 'price_asc') all.sort((a, b) => a.price - b.price);
      else if (sort === 'price_desc') all.sort((a, b) => b.price - a.price);
      else if (sort === 'rating') all.sort((a, b) => b.rating - a.rating);

      const total = all.length;
      const products = all.slice(skip, skip + limitNum);
      return res.json({ products, page: pageNum, pages: Math.ceil(total / limitNum), total });
    }

    let query = {};
    if (category) query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    if (search) {
      const s = new RegExp(search, 'i');
      query.$or = [{ title: s }, { brand: s }, { description: s }];
    }

    let sortObj = { createdAt: -1 };
    if (sort === 'price_asc') sortObj = { price: 1 };
    else if (sort === 'price_desc') sortObj = { price: -1 };
    else if (sort === 'rating') sortObj = { rating: -1 };
    else if (sort === 'newest') sortObj = { createdAt: -1 };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query).sort(sortObj).skip(skip).limit(limitNum);

    res.json({ products, page: pageNum, pages: Math.ceil(total / limitNum), total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/products/categories
const getCategories = async (req, res) => {
  try {
    if (!getConnectionStatus()) {
      const all = readFallback();
      const cats = [...new Set(all.map(p => p.category).filter(Boolean))].sort();
      return res.json(cats);
    }
    const cats = await Product.distinct('category');
    res.json(cats.sort());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    if (!getConnectionStatus()) {
      const all = readFallback();
      const p = all.find(x => String(x._id) === req.params.id || String(x.id) === req.params.id);
      if (!p) return res.status(404).json({ message: 'Product not found' });
      return res.json(p);
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/admin/products/:id
const deleteProduct = async (req, res) => {
  try {
    if (!getConnectionStatus()) return res.status(503).json(DB_OFFLINE_MSG);
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProducts, getCategories, getProductById, deleteProduct };
