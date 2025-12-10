const express = require('express');

// Import all admin route modules from the admin directory
const authRoutes = require('../../admin/routes/authRoutes');
const userRoutes = require('../../admin/routes/userRoutes');
const assistantRoutes = require('../../admin/routes/assistantRoutes');
const phoneNumberRoutes = require('../../admin/routes/phoneNumberRoutes');
const voiceRoutes = require('../../admin/routes/voiceRoutes');
const assignUserVoiceRoutes = require('../../admin/routes/assignUserVoiceRoutes');
const callRoutes = require('../../admin/routes/callRoutes');

const router = express.Router();

// ==================== Admin API Routes ====================

// Admin authentication
router.use('/auth', authRoutes);

// Admin management endpoints
router.use('/users', userRoutes);
router.use('/assistants', assistantRoutes);
router.use('/phone-numbers', phoneNumberRoutes);
router.use('/voices', voiceRoutes);
router.use('/assign-user-voice', assignUserVoiceRoutes);
router.use('/calls', callRoutes);

module.exports = router;