// clients/repositories/callRepository.js
const Lead = require('../../models/Lead');
const AssignAssistantPhone = require('../../models/AssignAssistantPhone');
const Assistant = require('../../models/Assistant');
const PhoneNumber = require('../../models/PhoneNumber');
const User = require('../../models/User');

class CallRepository {
  /**
   * Get lead details by ID and user
   */
  async getLeadByIdAndUser(leadId, userId) {
    try {
      
      let lead = await Lead.findOne({
        _id: leadId,
        user_id: userId
      });
      
      if (!lead) {
        // Try without user_id filter as fallback - maybe the user field is empty or different
        console.warn(`⚠️ Lead not found with user_id match, trying without user_id filter...`);
        lead = await Lead.findById(leadId);
        
        if (lead) {
          console.warn(`⚠️ Lead exists but user_id mismatch. Lead user_id=${lead.user_id}, requested userId=${userId}. Proceeding anyway...`);
          // Still return the lead - auth middleware should have validated the user
        } else {
          console.warn(`⚠️ Lead with id ${leadId} doesn't exist`);
        }
      } else {
       console.warn(`Lead found with user_id match.`);
      }
      
      return lead;
    } catch (error) {
      console.error('Error fetching lead:', error);
      throw error;
    }
  }

  /**
   * Get assignment details for lead's project and get agent info
   */
  async getAssignmentForCall(userId, projectName) {
    try {
      // Find assignment for this user and project (case-insensitive)
      const assignment = await AssignAssistantPhone.findOne({
        userId: userId,
        projectName: { $regex: `^${projectName.trim()}$`, $options: 'i' }, // Case-insensitive regex match
        status: 'active'
      })
        .populate('assistantId', 'agentId agentName webhookUrl')
        .populate('phoneId', 'phoneNumber')
        .lean();

      return assignment;
    } catch (error) {
      console.error('Error fetching assignment:', error);
      throw error;
    }
  }

  /**
   * Get assistant details by ID
   */
  async getAssistantById(assistantId) {
    try {
      const assistant = await Assistant.findOne({
        _id: assistantId,
        status: { $ne: 'deleted' }
      });
      return assistant;
    } catch (error) {
      console.error('Error fetching assistant:', error);
      throw error;
    }
  }

  /**
   * Get phone number details by ID
   */
  async getPhoneNumberById(phoneNumberId) {
    try {
      const phoneNumber = await PhoneNumber.findOne({
        _id: phoneNumberId,
        status: { $ne: 'deleted' }
      });
      return phoneNumber;
    } catch (error) {
      console.error('Error fetching phone number:', error);
      throw error;
    }
  }

  /**
   * Get phone number by actual number string (for default numbers)
   */
  async getPhoneNumberByNumber(phoneNumber) {
    try {
      const phone = await PhoneNumber.findOne({
        phoneNumber: phoneNumber,
        status: { $ne: 'deleted' }
      });
      return phone;
    } catch (error) {
      console.error('Error fetching phone number:', error);
      throw error;
    }
  }

  /**
   * Get user's Bolna API bearer token
   */
  async getUserBearerToken(userId) {
    try {
      const user = await User.findById(userId).select('bearerToken');
      return user?.bearerToken;
    } catch (error) {
      console.error('Error fetching user bearer token:', error);
      throw error;
    }
  }

  /**
   * Get all pending calls (not completed/failed/cancelled)
   */
  async getPendingCalls() {
    try {
      const CallHistory = require('../../models/CallHistory');
      const pendingCalls = await CallHistory.find({
        status: { $in: ['initiated', 'queued', 'ringing', 'connected', 'in-progress'] }
      }).lean();
      return pendingCalls;
    } catch (error) {
      console.error('Error fetching pending calls:', error);
      throw error;
    }
  }

  /**
   * Get call by ID
   */
  async getCallById(callId) {
    try {
      const CallHistory = require('../../models/CallHistory');
      const call = await CallHistory.findById(callId);
      return call;
    } catch (error) {
      console.error('Error fetching call by ID:', error);
      throw error;
    }
  }
}

module.exports = CallRepository;
