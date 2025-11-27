// clients/routes/phoneNumberRoutes.js
const express = require('express');
const router = express.Router();
const PhoneNumberController = require('../controllers/phoneNumberController');
const clientAuthMiddleware = require('../../middleware/clientMiddleware');
const { param } = require('express-validator');

const phoneNumberController = new PhoneNumberController();

/**
 * GET /phone-numbers
 * Get all phone numbers for authenticated user
 * Requires: Bearer token in Authorization header
 */
router.get(
  '/',
  clientAuthMiddleware,
  (req, res) => phoneNumberController.getAllPhoneNumbers(req, res)
);

/**
 * GET /phone-numbers/:id
 * Get single phone number by ID
 * Requires: Bearer token in Authorization header
 * Params: id - phone number ID
 */
router.get(
  '/:id',
  clientAuthMiddleware,
  param('id').notEmpty().withMessage('Phone number ID is required'),
  (req, res) => phoneNumberController.getPhoneNumberById(req, res)
);

module.exports = router;
