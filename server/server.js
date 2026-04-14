require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');

const app = express();
// Use Railway's port OR default to 8080
const PORT = process.env.PORT || 8080;

// 1. LITERALLY THE FIRST THING: INSTANT HEALTH CHECK
// Railway needs this to see the app is alive.
app.get('/', (req, res) => {
    res.status(200).send('HEALTHY');
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'up' });
});

// 2. Minimal Middleware
app.use(cors());
app.use(express.json());

// 3. API Routes (Wrapped in try/catch to prevent startup crashes)
try {
    app.use('/api/products', require('./routes/productRoutes'));
    app.use('/api/users', require('./routes/userRoutes'));
    app.use('/api/orders', require('./routes/orderRoutes'));
    app.use('/api/reviews', require('./routes/reviewRoutes'));
} catch (err) {
    console.error("Route Loading Error:", err.message);
}

// 4. BIND IMMEDIATELY
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 BIND SUCCESS: Listening on port ${PORT}`);
    
    // Connect to DB only AFTER the server is verified alive
    connectDB()
        .then(() => console.log("✅ DB Connected in background"))
        .catch(err => console.error("❌ DB Background Fail:", err.message));
});

// 5. Anti-Crash Protection
process.on('uncaughtException', (err) => {
    console.error('CRITICAL ERROR (Process stays alive):', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
