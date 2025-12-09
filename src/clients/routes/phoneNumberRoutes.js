const express = require('express');
const router = express.Router();
const phoneNumberController = require('../controllers/phoneNumberController');
const clientAuthMiddleware = require('../../middleware/clientMiddleware');

// Apply authentication to all routes
router.use(clientAuthMiddleware);

// GET /client/phone-numbers - Get current user's assigned phone numbers
router.get('/', (req, res) => phoneNumberController.getUserPhoneNumbers(req, res));

module.exports = router;