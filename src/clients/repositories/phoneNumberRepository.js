// clients/repositories/phoneNumberRepository.js
const PhoneNumber = require('../../models/PhoneNumber');

/**
 * Get all phone numbers for a specific user
 */
async function getPhoneNumbersByUserId(userId) {
  return await PhoneNumber.find({
    userId: userId,
    status: { $ne: 'deleted' }
  })
    .sort({ createdAt: -1 });
}

/**
 * Get single phone number by ID
 */
async function getPhoneNumberById(phoneNumberId, userId) {
  return await PhoneNumber.findOne({
    _id: phoneNumberId,
    userId: userId,
    status: { $ne: 'deleted' }
  });
}

/**
 * Get default phone number if no numbers exist
 */
async function getDefaultPhoneNumber() {
  return {
    _id: 'default-number',
    phoneNumber: '+918035735888',
    country: 'IN',
    status: 'available',
    friendlyName: 'Default Number',
    isDefault: true
  };
}

module.exports = {
  getPhoneNumbersByUserId,
  getPhoneNumberById,
  getDefaultPhoneNumber
};
