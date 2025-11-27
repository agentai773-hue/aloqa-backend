const PhoneNumber = require('../../models/PhoneNumber');

/**
 * Phone Number Repository
 * Handles all database operations for phone numbers
 */

class PhoneNumberRepository {
  /**
   * Find phone number by ID with optional population
   */
  async findById(id, populate = null) {
    let query = PhoneNumber.findById(id);
    if (populate) {
      query = query.populate(populate);
    }
    return await query;
  }

  /**
   * Find phone number by phone number string
   */
  async findByPhoneNumber(phoneNumber) {
    return await PhoneNumber.findOne({ phoneNumber });
  }

  /**
   * Find phone number by Bolna phone ID
   */
  async findByBolnaPhoneId(bolnaPhoneId) {
    return await PhoneNumber.findOne({ bolnaPhoneId });
  }

  /**
   * Find all phone numbers with filters
   */
  async findAll(filters = {}) {
    return await PhoneNumber.find(filters)
      .populate('userId', 'name email companyName')
      .sort({ createdAt: -1 });
  }

  /**
   * Create new phone number
   */
  async create(phoneNumberData) {
    const phoneNumber = new PhoneNumber(phoneNumberData);
    return await phoneNumber.save();
  }

  /**
   * Update phone number
   */
  async update(id, updateData) {
    return await PhoneNumber.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'name email companyName');
  }

  /**
   * Delete phone number
   */
  async delete(id) {
    return await PhoneNumber.findByIdAndDelete(id);
  }

  /**
   * Assign phone number to user
   */
  async assignToUser(id, userId, agentId = null) {
    const phoneNumber = await PhoneNumber.findById(id);
    if (!phoneNumber) {
      const error = new Error('Phone number not found');
      error.status = 404;
      throw error;
    }

    if (phoneNumber.status === 'assigned') {
      const error = new Error('Phone number already assigned to another user');
      error.status = 400;
      throw error;
    }

    if (phoneNumber.status === 'deleted') {
      const error = new Error('Phone number has been deleted');
      error.status = 400;
      throw error;
    }

    phoneNumber.userId = userId;
    phoneNumber.agentId = agentId;
    phoneNumber.status = 'assigned';
    phoneNumber.assignedAt = new Date();

    await phoneNumber.save();
    await phoneNumber.populate('userId', 'name email companyName');

    return phoneNumber;
  }

  /**
   * Unassign phone number from user
   */
  async unassignFromUser(id) {
    const phoneNumber = await PhoneNumber.findById(id);
    if (!phoneNumber) {
      const error = new Error('Phone number not found');
      error.status = 404;
      throw error;
    }

    phoneNumber.userId = null;
    phoneNumber.agentId = null;
    phoneNumber.status = 'available';
    phoneNumber.assignedAt = null;

    return await phoneNumber.save();
  }

  /**
   * Count phone numbers by filters
   */
  async count(filters = {}) {
    return await PhoneNumber.countDocuments(filters);
  }

  /**
   * Get available phone numbers
   */
  async getAvailable() {
    return await PhoneNumber.find({ status: 'available' })
      .sort({ createdAt: -1 });
  }

  /**
   * Get assigned phone numbers by user
   */
  async getByUserId(userId) {
    return await PhoneNumber.find({ userId, status: 'assigned' })
      .populate('userId', 'name email companyName')
      .sort({ assignedAt: -1 });
  }
}

module.exports = new PhoneNumberRepository();
