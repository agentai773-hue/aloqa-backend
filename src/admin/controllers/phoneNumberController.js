const phoneNumberService = require('../services/phoneNumberService');
const PhoneNumber = require('../../models/PhoneNumber');

/**
 * Phone Number Controller
 * Handles HTTP requests and responses for phone number operations
 */

/**
 * @desc    Get purchased phone numbers from Bolna (using Aloqa_TOKEN)
 * @route   GET /api/phone-numbers/purchased
 * @access  Private (Admin only)
 */
const getPurchasedPhoneNumbers = async (req, res) => {
  try {
    const phoneNumbers = await phoneNumberService.getPurchasedPhoneNumbersFromBolna();

    res.json({
      success: true,
      data: phoneNumbers
    });
  } catch (error) {
    console.error('❌ Get purchased phone numbers error:', error);
    
    const status = error.status || error.response?.status || 500;
    res.status(status).json({
      success: false,
      message: error.message || error.response?.data?.message || 'Failed to get purchased phone numbers',
      error: error.response?.data || error.message
    });
  }
};

/**
 * @desc    Search available phone numbers from Bolna
 * @route   GET /api/phone-numbers/search
 * @access  Private (Admin only)
 */
const searchPhoneNumbers = async (req, res) => {
  try {
    const { country = 'IN', pattern, userId } = req.query;

    const phoneNumbers = await phoneNumberService.searchPhoneNumbers(country, pattern, userId);

    res.json({
      success: true,
      data: phoneNumbers
    });
  } catch (error) {
    console.error('❌ Search phone numbers error:', error);
    
    const status = error.status || error.response?.status || 500;
    res.status(status).json({
      success: false,
      message: error.message || error.response?.data?.message || 'Failed to search phone numbers',
      error: error.response?.data || error.message
    });
  }
};

/**
 * @desc    Buy a phone number from Bolna
 * @route   POST /api/phone-numbers/buy
 * @access  Private (Admin only)
 */
const buyPhoneNumber = async (req, res) => {
  try {
    const { country, phoneNumber, userId } = req.body;

    const newPhoneNumber = await phoneNumberService.buyPhoneNumber(country, phoneNumber, userId);

    res.status(201).json({
      success: true,
      message: 'Phone number purchased successfully',
      data: newPhoneNumber
    });
  } catch (error) {
    console.error('❌ Buy phone number error:', error);
    
    const status = error.status || error.response?.status || 500;
    res.status(status).json({
      success: false,
      message: error.message || error.response?.data?.message || 'Failed to buy phone number',
      error: error.response?.data || error.message
    });
  }
};

/**
 * @desc    Assign phone number to user
 * @route   POST /api/phone-numbers/assign
 * @access  Private (Admin only)
 */
const assignPhoneNumber = async (req, res) => {
  try {
    const { phoneNumber, userId } = req.body;

    // Check if phone number already assigned
    const existingAssignment = await PhoneNumber.findOne({ phoneNumber, status: 'assigned' });
    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: 'This phone number is already assigned to another user. Please select a different number.'
      });
    }

    const assignment = await phoneNumberService.assignPhoneNumber(phoneNumber, userId);

    res.status(201).json({
      success: true,
      message: 'Phone number assigned successfully',
      data: assignment
    });
  } catch (error) {
    console.error('❌ Assign phone number error:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to assign phone number'
    });
  }
};

/**
 * @desc    Get assigned phone numbers
 * @route   GET /api/phone-numbers/assigned
 * @access  Private (Admin only)
 */
const getAssignedPhoneNumbers = async (req, res) => {
  try {
    const assignedNumbers = await phoneNumberService.getAssignedPhoneNumbers();

    res.json({
      success: true,
      data: assignedNumbers
    });
  } catch (error) {
    console.error('❌ Get assigned phone numbers error:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get assigned phone numbers'
    });
  }
};

module.exports = {
  getPurchasedPhoneNumbers,
  searchPhoneNumbers,
  buyPhoneNumber,
  assignPhoneNumber,
  getAssignedPhoneNumbers
};
