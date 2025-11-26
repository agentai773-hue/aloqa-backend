const PhoneNumber = require('../../models/PhoneNumber');
const User = require('../../models/User');
const axios = require('axios');

const BOLNA_API_URL = 'https://api.bolna.ai';

// Search available phone numbers from Bolna
const searchPhoneNumbers = async (req, res) => {
  try {
    const { country = 'IN', pattern = '800', userId } = req.query;

    if (!userId) {
      return res.status(400).json({ 
        success: false,
        message: 'User ID is required to search phone numbers' 
      });
    }

    // Get user's bearer token
    const user = await User.findById(userId).select('bearerToken');
    if (!user || !user.bearerToken) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found or bearer token not configured' 
      });
    }

    const response = await axios.get(`${BOLNA_API_URL}/phone-numbers/search`, {
      params: { country, pattern },
      headers: {
        'Authorization': `Bearer ${user.bearerToken}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Search phone numbers error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'Failed to search phone numbers',
      error: error.message
    });
  }
};

// Buy a phone number from Bolna
const buyPhoneNumber = async (req, res) => {
  try {
    const { country, phoneNumber, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        success: false,
        message: 'User ID is required to purchase phone number' 
      });
    }

    if (!country || !phoneNumber) {
      return res.status(400).json({ 
        success: false,
        message: 'Country and phone number are required' 
      });
    }

    // Get user's bearer token
    const user = await User.findById(userId).select('bearerToken');
    if (!user || !user.bearerToken) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found or bearer token not configured' 
      });
    }

    // Check if number already exists in database
    const existingNumber = await PhoneNumber.findOne({ phoneNumber });
    if (existingNumber) {
      return res.status(400).json({ 
        success: false,
        message: 'Phone number already purchased' 
      });
    }

    // Buy from Bolna
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

    // Save to database (NOT assigned yet, status = 'available')
    const newPhoneNumber = new PhoneNumber({
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

    await newPhoneNumber.save();

    res.status(201).json({
      success: true,
      message: 'Phone number purchased successfully',
      data: newPhoneNumber
    });
  } catch (error) {
    console.error('Buy phone number error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'Failed to buy phone number',
      error: error.message
    });
  }
};

// Assign phone number to user
const assignPhoneNumber = async (req, res) => {
  try {
    const { phoneNumberId, userId, agentId } = req.body;

    if (!phoneNumberId || !userId) {
      return res.status(400).json({ 
        success: false,
        message: 'Phone number ID and user ID are required' 
      });
    }

    // Find phone number
    const phoneNumber = await PhoneNumber.findById(phoneNumberId);
    if (!phoneNumber) {
      return res.status(404).json({ 
        success: false,
        message: 'Phone number not found' 
      });
    }

    if (phoneNumber.status === 'assigned') {
      return res.status(400).json({ 
        success: false,
        message: 'Phone number already assigned to another user' 
      });
    }

    if (phoneNumber.status === 'deleted') {
      return res.status(400).json({ 
        success: false,
        message: 'Phone number has been deleted' 
      });
    }

    // Assign to user
    phoneNumber.userId = userId;
    phoneNumber.agentId = agentId || null;
    phoneNumber.status = 'assigned';
    phoneNumber.assignedAt = new Date();

    await phoneNumber.save();

    // Populate user details (match User model fields)
    await phoneNumber.populate('userId', 'name email companyName');

    res.json({
      success: true,
      message: 'Phone number assigned successfully',
      data: phoneNumber
    });
  } catch (error) {
    console.error('Assign phone number error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign phone number',
      error: error.message
    });
  }
};

// Get all phone numbers (with filters)
const getAllPhoneNumbers = async (req, res) => {
  try {
    const { status, userId, country } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    if (country) filter.country = country;

    const phoneNumbers = await PhoneNumber.find(filter)
      .populate('userId', 'name email companyName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: phoneNumbers.length,
      data: phoneNumbers
    });
  } catch (error) {
    console.error('Get phone numbers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch phone numbers',
      error: error.message
    });
  }
};

// Delete phone number (Bolna first, then database)
const deletePhoneNumber = async (req, res) => {
  try {
    const { id } = req.params;

    // Find in database and populate user
    const phoneNumber = await PhoneNumber.findById(id).populate('userId', 'bearerToken');
    if (!phoneNumber) {
      return res.status(404).json({ 
        success: false,
        message: 'Phone number not found in database' 
      });
    }

    // If phone number was assigned, we need the user's bearer token
    // If not assigned, we might not have a user - handle gracefully
    if (phoneNumber.userId?.bearerToken) {
      // Delete from Bolna first
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
      } catch (bolnaError) {
        console.error('Bolna delete error:', bolnaError.response?.data || bolnaError.message);
        return res.status(bolnaError.response?.status || 500).json({
          success: false,
          message: 'Failed to delete from Bolna. Database not modified.',
          error: bolnaError.response?.data?.message || bolnaError.message
        });
      }
    } else {
      console.log('No bearer token found, skipping Bolna deletion');
    }

    // After successful Bolna deletion (or no user), delete from database
    await PhoneNumber.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Phone number deleted successfully from Bolna and database'
    });
  } catch (error) {
    console.error('Delete phone number error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete phone number',
      error: error.message
    });
  }
};

// Unassign phone number from user
const unassignPhoneNumber = async (req, res) => {
  try {
    const { id } = req.params;

    const phoneNumber = await PhoneNumber.findById(id);
    if (!phoneNumber) {
      return res.status(404).json({ 
        success: false,
        message: 'Phone number not found' 
      });
    }

    phoneNumber.userId = null;
    phoneNumber.agentId = null;
    phoneNumber.status = 'available';
    phoneNumber.assignedAt = null;

    await phoneNumber.save();

    res.json({
      success: true,
      message: 'Phone number unassigned successfully',
      data: phoneNumber
    });
  } catch (error) {
    console.error('Unassign phone number error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unassign phone number',
      error: error.message
    });
  }
};

module.exports = {
  searchPhoneNumbers,
  buyPhoneNumber,
  assignPhoneNumber,
  getAllPhoneNumbers,
  deletePhoneNumber,
  unassignPhoneNumber
};
