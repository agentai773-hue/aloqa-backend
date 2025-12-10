const express = require('express');
const router = express.Router();
const callController = require('../controllers/callController');
const callValidation = require('../../validators/admin/callValidation');
const { protect } = require('../../middleware/auth');

// Apply authentication middleware to all routes
router.use(protect);

// ==================== ADMIN CALL API ENDPOINTS ====================

// @route   POST /api/admin/calls/sample
// @desc    Make a sample call
// @access  Private (Admin only)
router.post(
  '/sample',
  callValidation.makeSampleCall,
  callController.makeSampleCall
);

module.exports = router;