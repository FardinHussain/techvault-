require('dotenv').config();
const fetch = require('node-fetch');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('./models/Product');

const DUMMYJSON_URL = 'https://dummyjson.com/products?limit=100&skip=0';

const mapProduct = (p) => ({
  title: p.title || 'Unnamed Product',
  description: p.description || '',
  brand: p.brand || 'Generic',
  category: (p.category || 'general').toLowerCase(),
  price: Number(p.price) || 0,
  discountPercentage: Number(p.discountPercentage) || 0,
  rating: Number(p.rating) || 0,
  stock: Number(p.stock) || 0,
  images: Array.isArray(p.images) ? p.images : [],
  thumbnail: p.thumbnail || '',
  tags: Array.isArray(p.tags) ? p.tags : [],
  numReviews: Math.floor(Math.random() * 80) + 5,
});

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) throw new Error('MONGO_URI not set in .env');

    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
    console.log('✅ Connected to MongoDB');

    const count = await Product.countDocuments();
    if (count > 0) {
      console.log(`ℹ️  DB already has ${count} products — skipping seed.`);
      await mongoose.disconnect();
      return true;
    }

    console.log('📦 Fetching products from DummyJSON...');
    const res = await fetch(DUMMYJSON_URL);
    if (!res.ok) throw new Error(`DummyJSON responded with ${res.status}`);
    const data = await res.json();

    const products = data.products.map(mapProduct);

    // Write local fallback JSON
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(path.join(dataDir, 'products.json'), JSON.stringify(products, null, 2));
    console.log('💾 Saved local fallback to server/data/products.json');

    await Product.insertMany(products);
    console.log(`🌱 Seeded ${products.length} products into MongoDB.`);

    await mongoose.disconnect();
    return true;
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    return false;
  }
};

if (require.main === module) {
  seedDB().then((ok) => process.exit(ok ? 0 : 1));
}

module.exports = seedDB;
