// clients/services/phoneNumberService.js
const {
  getPhoneNumbersByUserId,
  getPhoneNumberById,
  getDefaultPhoneNumber
} = require('../repositories/phoneNumberRepository');

class PhoneNumberService {
  /**
   * Get all phone numbers for user
   * If no numbers found, return default number
   */
  async getAllPhoneNumbers(userId) {
    try {
      const phoneNumbers = await getPhoneNumbersByUserId(userId);

      // If no phone numbers exist, return default number
      if (!phoneNumbers || phoneNumbers.length === 0) {
        const defaultNumber = await getDefaultPhoneNumber();
        return {
          success: true,
          message: 'Using default phone number',
          data: [defaultNumber],
          isDefault: true
        };
      }

      return {
        success: true,
        message: 'Phone numbers retrieved successfully',
        data: phoneNumbers,
        isDefault: false
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get single phone number by ID
   */
  async getPhoneNumberById(phoneNumberId, userId) {
    try {
      const phoneNumber = await getPhoneNumberById(phoneNumberId, userId);

      if (!phoneNumber) {
        return {
          success: false,
          error: 'Phone number not found'
        };
      }

      return {
        success: true,
        message: 'Phone number retrieved successfully',
        data: phoneNumber
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = PhoneNumberService;
