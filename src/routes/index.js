const express = require('express');
const router = express.Router();

// Import route modules
const adminRoutes = require('./admin');
const clientRoutes = require('./client');

// Mount routes
router.use('/admin', adminRoutes);
router.use('/client', clientRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Aloqa AI API Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Aloqa AI API',
    endpoints: {
      admin: '/api/admin',
      client: '/api/client',
      health: '/api/health'
    }
  });
});

module.exports = router;