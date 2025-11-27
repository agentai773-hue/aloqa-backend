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

// All routes require admin authentication
router.use(protect);

// Get purchased phone numbers from Bolna
router.get('/purchased', getPurchasedPhoneNumbers);

// Search available phone numbers from Bolna
router.get('/search', searchPhoneNumbers);

// Buy a phone number from Bolna
router.post('/buy', buyPhoneNumber);

// Assign phone number to user
router.post('/assign', assignPhoneNumber);

// Get assigned phone numbers
router.get('/assigned', getAssignedPhoneNumbers);

module.exports = router;
