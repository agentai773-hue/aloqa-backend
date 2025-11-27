// clients/controllers/phoneNumberController.js
const PhoneNumberService = require('../services/phoneNumberService');
const { validationResult } = require('express-validator');

class PhoneNumberController {
  constructor() {
    this.phoneNumberService = new PhoneNumberService();
  }

  /**
   * Get all phone numbers for authenticated user
   * GET /clients/phone-numbers
   */
  async getAllPhoneNumbers(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const userId = req.user._id;

      const result = await this.phoneNumberService.getAllPhoneNumbers(userId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get single phone number by ID
   * GET /clients/phone-numbers/:id
   */
  async getPhoneNumberById(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const userId = req.user._id;

      const result = await this.phoneNumberService.getPhoneNumberById(id, userId);

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = PhoneNumberController;
