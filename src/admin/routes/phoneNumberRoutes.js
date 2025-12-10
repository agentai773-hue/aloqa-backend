const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const {
  searchPhoneNumbers,
  buyPhoneNumber,
  getPurchasedPhoneNumbers,
  assignPhoneNumber,
  getAssignedPhoneNumbers
} = require('../controllers/phoneNumberController');

// Apply authentication middleware to all routes
router.use(protect);

// ==================== ADMIN PHONE NUMBER API ENDPOINTS ====================

// @route   GET /api/admin/phone-numbers/list/purchased
// @desc    Get purchased phone numbers from Bolna
// @access  Private (Admin only)
router.get('/list/purchased', getPurchasedPhoneNumbers);

// @route   GET /api/admin/phone-numbers/search
// @desc    Search available phone numbers from Bolna
// @access  Private (Admin only)
router.get('/search', searchPhoneNumbers);

// @route   POST /api/admin/phone-numbers/buy
// @desc    Buy a phone number from Bolna
// @access  Private (Admin only)
router.post('/buy', buyPhoneNumber);

// @route   POST /api/admin/phone-numbers/assign
// @desc    Assign phone number to user
// @access  Private (Admin only)
router.post('/assign', assignPhoneNumber);

// @route   GET /api/admin/phone-numbers/list/assigned
// @desc    Get assigned phone numbers
// @access  Private (Admin only)
router.get('/list/assigned', getAssignedPhoneNumbers);

module.exports = router;
