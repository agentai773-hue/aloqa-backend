const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const assistantRoutes = require('./assistantRoutes');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Authentication routes
router.use('/auth', authRoutes);

// User management routes
router.use('/users', userRoutes);

// Assistant management routes
router.use('/assistants', assistantRoutes);

module.exports = router;
