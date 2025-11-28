const axios = require('axios');
const phoneNumberRepository = require('../repositories/phoneNumberRepository');
const User = require('../../models/User');
const PhoneNumber = require('../../models/PhoneNumber');

const BOLNA_API_URL = process.env.BOLNA_API_URL || 'https://api.bolna.ai';
const ALOQA_TOKEN = process.env.ALOQA_TOKEN;

/**
 * Phone Number Service
 * Business logic layer for phone number operations
 */

class PhoneNumberService {
  /**
   * Search available phone numbers from Bolna
   */
  async searchPhoneNumbers(country = 'IN', pattern = null, userId) {
    if (!userId) {
      const error = new Error('User ID is required to search phone numbers');
      error.status = 400;
      throw error;
    }

    // Get user's bearer token
    const user = await User.findById(userId).select('bearerToken');
    if (!user || !user.bearerToken) {
      const error = new Error('User not found or bearer token not configured');
      error.status = 401;
      throw error;
    }

    // Build query params
    const queryParams = { country };
    if (pattern && pattern.trim() !== '') {
      queryParams.pattern = pattern;
    }

    console.log('🔍 Searching phone numbers with params:', queryParams);

    try {
      const response = await axios.get(`${BOLNA_API_URL}/phone-numbers`, {
        params: queryParams,
        headers: {
          'Authorization': `Bearer ${user.bearerToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Search phone numbers response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Bolna search error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Buy phone number from Bolna and save to database
   */
  async buyPhoneNumber(country, phoneNumber, userId) {
    if (!userId) {
      const error = new Error('User ID is required to purchase phone number');
      error.status = 400;
      throw error;
    }

    if (!country || !phoneNumber) {
      const error = new Error('Country and phone number are required');
      error.status = 400;
      throw error;
    }

    // Get user's bearer token
    const user = await User.findById(userId).select('bearerToken');
    if (!user || !user.bearerToken) {
      const error = new Error('User not found or bearer token not configured');
      error.status = 401;
      throw error;
    }

    // Check if number already exists in database
    const existingNumber = await phoneNumberRepository.findByPhoneNumber(phoneNumber);
    if (existingNumber) {
      const error = new Error('Phone number already purchased');
      error.status = 400;
      throw error;
    }

    // Buy from Bolna
    console.log('💰 Purchasing phone number from Bolna:', phoneNumber);
    
    try {
      const response = await axios.post(
        `${BOLNA_API_URL}/phone-numbers/buy`,
        { country, phone_number: phoneNumber },
        {
          headers: {
            'Authorization': `Bearer ${user.bearerToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const bolnaData = response.data;
      console.log('✅ Bolna purchase successful:', bolnaData);

      // Save to database (NOT assigned yet, status = 'available')
      const newPhoneNumber = await phoneNumberRepository.create({
        bolnaPhoneId: bolnaData.id,
        phoneNumber: bolnaData.phone_number,
        country,
        telephonyProvider: bolnaData.telephony_provider,
        telephonySid: bolnaData.telephony_sid,
        price: bolnaData.price,
        bolnaOwned: bolnaData.bolna_owned,
        renewal: bolnaData.renewal,
        paymentUuid: bolnaData.payment_uuid,
        status: 'available', // Available for assignment
        purchasedAt: new Date(bolnaData.created_at)
      });

      console.log('✅ Phone number saved to database:', newPhoneNumber._id);
      return newPhoneNumber;
    } catch (error) {
      console.error('❌ Bolna purchase error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Assign phone number to user
   */
  async assignPhoneNumber(phoneNumberId, userId, agentId = null) {
    if (!phoneNumberId || !userId) {
      const error = new Error('Phone number ID and user ID are required');
      error.status = 400;
      throw error;
    }

    console.log(`📞 Assigning phone number ${phoneNumberId} to user ${userId}`);
    
    const phoneNumber = await phoneNumberRepository.assignToUser(phoneNumberId, userId, agentId);
    
    console.log('✅ Phone number assigned successfully');
    return phoneNumber;
  }

  /**
   * Unassign phone number from user
   */
  async unassignPhoneNumber(phoneNumberId) {
    console.log(`📞 Unassigning phone number ${phoneNumberId}`);
    
    const phoneNumber = await phoneNumberRepository.unassignFromUser(phoneNumberId);
    
    console.log('✅ Phone number unassigned successfully');
    return phoneNumber;
  }

  /**
   * Get all phone numbers with optional filters
   */
  async getAllPhoneNumbers(filters = {}) {
    const queryFilters = {};
    
    if (filters.status) queryFilters.status = filters.status;
    if (filters.userId) queryFilters.userId = filters.userId;
    if (filters.country) queryFilters.country = filters.country;

    return await phoneNumberRepository.findAll(queryFilters);
  }

  /**
   * Get phone number by ID
   */
  async getPhoneNumberById(id) {
    const phoneNumber = await phoneNumberRepository.findById(id, 'userId agentId');
    if (!phoneNumber) {
      const error = new Error('Phone number not found');
      error.status = 404;
      throw error;
    }
    return phoneNumber;
  }

  /**
   * Delete phone number (from Bolna first, then database)
   */
  async deletePhoneNumber(id) {
    // Find in database and populate user
    const phoneNumber = await phoneNumberRepository.findById(id, {
      path: 'userId',
      select: 'bearerToken'
    });

    if (!phoneNumber) {
      const error = new Error('Phone number not found in database');
      error.status = 404;
      throw error;
    }

    // If phone number was assigned, delete from Bolna
    if (phoneNumber.userId?.bearerToken) {
      console.log('🗑️ Deleting phone number from Bolna:', phoneNumber.bolnaPhoneId);
      
      try {
        await axios.delete(
          `${BOLNA_API_URL}/phone-numbers/delete`,
          {
            headers: {
              'Authorization': `Bearer ${phoneNumber.userId.bearerToken}`,
              'Content-Type': 'application/json'
            },
            data: {
              phone_number_id: phoneNumber.bolnaPhoneId
            }
          }
        );
        console.log('✅ Deleted from Bolna successfully');
      } catch (bolnaError) {
        console.error('❌ Bolna delete error:', bolnaError.response?.data || bolnaError.message);
        const error = new Error('Failed to delete from Bolna. Database not modified.');
        error.status = bolnaError.response?.status || 500;
        error.details = bolnaError.response?.data?.message || bolnaError.message;
        throw error;
      }
    } else {
      console.log('⚠️ No bearer token found, skipping Bolna deletion');
    }

    // Delete from database
    await phoneNumberRepository.delete(id);
    console.log('✅ Phone number deleted from database');
    
    return { message: 'Phone number deleted successfully from Bolna and database' };
  }

  /**
   * Get available phone numbers
   */
  async getAvailablePhoneNumbers() {
    return await phoneNumberRepository.getAvailable();
  }

  /**
   * Get phone numbers by user ID
   */
  async getPhoneNumbersByUserId(userId) {
    return await phoneNumberRepository.getByUserId(userId);
  }

  /**
   * Get purchased phone numbers from Bolna using Aloqa_TOKEN
   */
  async getPurchasedPhoneNumbersFromBolna() {
    if (!ALOQA_TOKEN) {
      const error = new Error('ALOQA_TOKEN not configured in environment variables');
      error.status = 500;
      throw error;
    }

    console.log('🔍 Fetching purchased phone numbers from Bolna...');

    try {
      const response = await axios.get(`${BOLNA_API_URL}/phone-numbers/all`, {
        headers: {
          'Authorization': `Bearer ${ALOQA_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Purchased phone numbers fetched:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('❌ Bolna API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Assign phone number to user (store in database)
   */
  async assignPhoneNumber(phoneNumber, userId) {
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }

    // Check if phone number is already assigned
    const existingAssignment = await PhoneNumber.findOne({ phoneNumber, status: 'assigned' });
    if (existingAssignment) {
      const error = new Error('This phone number is already assigned to another user. Please select a different number.');
      error.status = 400;
      throw error;
    }

    // Get phone number details from Bolna to set renewal date
    let renewalDate = new Date();
    renewalDate.setMonth(renewalDate.getMonth() + 1); // Default to 1 month from now

    try {
      const bolnaNumbers = await this.getPurchasedPhoneNumbersFromBolna();
      const bolnaNumber = bolnaNumbers.find(num => num.phone_number === phoneNumber);
      
      if (bolnaNumber && bolnaNumber.renewal_at) {
        renewalDate = new Date(bolnaNumber.renewal_at);
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch renewal date from Bolna, using default');
    }

    // Create or update assignment
    const assignment = await PhoneNumber.findOneAndUpdate(
      { phoneNumber },
      {
        phoneNumber,
        userId,
        assignedAt: new Date(),
        renewalDate,
        status: 'assigned'
      },
      { upsert: true, new: true }
    );

    console.log('✅ Phone number assigned:', phoneNumber, 'to user:', userId);
    return assignment;
  }

  /**
   * Get all assigned phone numbers with user details
   */
  async getAssignedPhoneNumbers() {
    const assignments = await PhoneNumber.find({ status: 'assigned' })
      .populate('userId', 'email companyName')
      .sort({ assignedAt: -1 });

    return assignments;
  }
}

module.exports = new PhoneNumberService();
