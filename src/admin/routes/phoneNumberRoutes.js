const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const {
  searchPhoneNumbers,
  buyPhoneNumber,
  assignPhoneNumber,
  getAllPhoneNumbers,
  deletePhoneNumber,
  unassignPhoneNumber
} = require('../controllers/phoneNumberController');

// All routes require admin authentication
router.use(protect);

// Search available phone numbers from Bolna
router.get('/search', searchPhoneNumbers);

// Get all phone numbers (with optional filters)
router.get('/', getAllPhoneNumbers);

// Buy a phone number from Bolna
router.post('/buy', buyPhoneNumber);

// Assign phone number to user
router.post('/assign', assignPhoneNumber);

// Unassign phone number from user
router.patch('/:id/unassign', unassignPhoneNumber);

// Delete phone number (from Bolna first, then database)
router.delete('/:id', deletePhoneNumber);

module.exports = router;
