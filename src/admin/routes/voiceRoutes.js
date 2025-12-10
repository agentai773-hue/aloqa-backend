const express = require('express');
const { getVoices, getVoiceById } = require('../controllers/voiceController');
const { protect } = require('../../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// ==================== ADMIN VOICE API ENDPOINTS ====================

// @route   GET /api/admin/voices/list
// @desc    Get all voices
// @access  Private (Admin only)
router.get('/list', getVoices);

// @route   GET /api/admin/voices/get/:voiceId
// @desc    Get voice by ID
// @access  Private (Admin only)
router.get('/get/:voiceId', getVoiceById);

module.exports = router;