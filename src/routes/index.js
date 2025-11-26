const express = require('express');
const authRoutes = require('../admin/routes/authRoutes');
const userRoutes = require('../admin/routes/userRoutes');
const assistantRoutes = require('../admin/routes/assistantRoutes');
const clientAuthRoutes = require('../clients/routes/authRoutes');
const leadRoutes = require('../clients/routes/leadRoutes');

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


/// clients routes

// Lead management routes
router.use('/leads', leadRoutes);

router.use('/client-auth', clientAuthRoutes);


module.exports = router;
