const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { getConnectionStatus } = require('../config/db');

const DB_OFFLINE_MSG = { message: 'Database offline' };

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// POST /api/users/register
const registerUser = async (req, res) => {
  try {
    if (!getConnectionStatus()) return res.status(503).json(DB_OFFLINE_MSG);
    const { name, email, password } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Name is required' });
    if (!email || !email.trim()) return res.status(400).json({ message: 'Email is required' });
    if (!password) return res.status(400).json({ message: 'Password is required' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(400).json({ message: 'An account with this email already exists' });

    const isAdmin = email.toLowerCase().trim() === (process.env.ADMIN_EMAIL || '').toLowerCase();
    const user = await User.create({ name: name.trim(), email, password, isAdmin });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/users/login
const loginUser = async (req, res) => {
  try {
    if (!getConnectionStatus()) return res.status(503).json(DB_OFFLINE_MSG);
    const { email, password } = req.body;
    if (!email || !email.trim()) return res.status(400).json({ message: 'Email is required' });
    if (!password) return res.status(400).json({ message: 'Password is required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const match = await user.matchPassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid email or password' });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/users/profile
const getUserProfile = async (req, res) => {
  try {
    if (!getConnectionStatus()) return res.status(503).json(DB_OFFLINE_MSG);
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/users/count
const getUserCount = async (req, res) => {
  try {
    if (!getConnectionStatus()) return res.status(503).json(DB_OFFLINE_MSG);
    const count = await User.countDocuments();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, getUserProfile, getUserCount };
