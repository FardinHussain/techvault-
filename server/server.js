require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const fetch = require('node-fetch');

const { connectDB } = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const { protect, admin } = require('./middleware/authMiddleware');
const { deleteProduct } = require('./controllers/productController');
const { getAllOrders, updateOrderStatus, getStats } = require('./controllers/orderController');
const { getUserCount } = require('./controllers/userController');

const app = express();
const PORT = process.env.PORT || 3000; // Fallback to 3000 if env is missing

// ── 1. FAST HEALTH CHECK ─────────────────────────────────────
// Place this BEFORE any logic. Railway uses this to see if the app is alive.
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// ── 2. Middleware ─────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'https://techhvault.netlify.app',
  ],
  credentials: true,
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ── 3. API Routes ─────────────────────────────────────────────
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);

app.get('/api/admin/stats', protect, admin, getStats);
app.get('/api/admin/orders', protect, admin, getAllOrders);
app.put('/api/admin/orders/:id/status', protect, admin, updateOrderStatus);
app.delete('/api/admin/products/:id', protect, admin, deleteProduct);
app.get('/api/admin/users/count', protect, admin, getUserCount);

// ── 4. Fallback Logic Functions ───────────────────────────────
const ensureFallbackData = async () => {
  const dataDir = path.join(__dirname, 'data');
  const jsonPath = path.join(dataDir, 'products.json');
  if (fs.existsSync(jsonPath)) return;
  try {
    const res = await fetch('https://dummyjson.com/products?limit=100');
    const data = await res.json();
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const mapped = data.products.map(p => ({
      _id: String(p.id),
      title: p.title,
      description: p.description,
      price: p.price,
      category: p.category,
      stock: p.stock,
      images: p.images,
      thumbnail: p.thumbnail,
      rating: p.rating,
      numReviews: Math.floor(Math.random() * 50)
    }));
    fs.writeFileSync(jsonPath, JSON.stringify(mapped, null, 2));
    console.log('✅ Fallback JSON saved');
  } catch (err) {
    console.log('❌ Fallback fetch failed:', err.message);
  }
};

const autoSeed = async () => {
  try {
    const Product = require('./models/Product');
    const count = await Product.countDocuments();
    if (count === 0) {
      console.log('🌱 Seeding database...');
      const seedDB = require('./seed');
      await seedDB();
    } else {
      console.log(`📦 ${count} products exist`);
    }
  } catch (err) {
    console.log('❌ Seed error:', err.message);
  }
};

// ── 5. SPA Fallback (Keep this last) ──────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ── 6. START SERVER (IMMEDIATE BINDING) ───────────────────────
const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server listening on port ${PORT}`);
  
  // Background initialization
  try {
    const dbOk = await connectDB();
    if (dbOk) {
      await autoSeed();
    } else {
      await ensureFallbackData();
    }
    console.log(`🗄️ DB Status: ${dbOk ? 'Connected' : 'Fallback Mode'}`);
  } catch (initError) {
    console.error('⚠️ Post-launch init failed:', initError.message);
  }
});

// ── 7. Error Handling ─────────────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
