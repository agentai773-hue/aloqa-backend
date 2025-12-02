const express = require('express');
const { getVoices, getVoiceById } = require('../controllers/voiceController');
const { protect } = require('../../middleware/auth');

const router = express.Router();

// Get all voices
router.get('/', protect, getVoices);

// Get voice by ID
router.get('/:voiceId', protect, getVoiceById);

module.exports = router;