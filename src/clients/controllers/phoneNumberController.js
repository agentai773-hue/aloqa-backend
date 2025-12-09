const PhoneNumber = require('../../models/PhoneNumber');

class PhoneNumberController {
  // Get phone numbers assigned to current user
  async getUserPhoneNumbers(req, res) {
    try {
      const userId = req.user.id;

      const phoneNumbers = await PhoneNumber.find({ 
        userId: userId,
        status: 'assigned'
      }).select('_id phoneNumber country status assignedAt').sort({ assignedAt: -1 });

      res.status(200).json({
        success: true,
        message: 'Phone numbers fetched successfully',
        data: phoneNumbers
      });
    } catch (error) {
      console.error('❌ Get user phone numbers error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get user phone numbers'
      });
    }
  }
}

module.exports = new PhoneNumberController();