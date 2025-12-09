const express = require('express');
const router = express.Router();

// Import route files
const authRoutes = require('../../clients/routes/authRoutes');
const projectRoutes = require('../../clients/routes/projectRoutes');
const leadRoutes = require('../../clients/routes/leadRoutes');
const phoneNumberRoutes = require('../../clients/routes/phoneNumberRoutes');
const assistantRoutes = require('../../clients/routes/assistantRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/leads', leadRoutes);
router.use('/phone-numbers', phoneNumberRoutes);
router.use('/assistants', assistantRoutes);

module.exports = router;
