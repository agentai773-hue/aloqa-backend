const CallHistory = require('../../models/CallHistory');

class CallHistoryRepository {
  // Create new call history record
  async create(callData) {
    const callHistory = new CallHistory(callData);
    return await callHistory.save();
  }

  // Get all call history for a user
  async getByUserId(userId, options = {}) {
    const { limit = 50, skip = 0, leadId = null } = options;
    let query = { userId };
    
    if (leadId) {
      query.leadId = leadId;
    }
    
    return await CallHistory.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('leadId')
      .populate('phoneNumberId')
      .populate('assistantId');
  }

  // Get call history count for a user
  async getUserCallHistoryCount(userId) {
    return await CallHistory.countDocuments({ userId });
  }

  // Get call history for a specific lead
  async getByLeadId(leadId) {
    return await CallHistory.find({ leadId })
      .sort({ createdAt: -1 })
      .populate('userId')
      .populate('assistantId');
  }

  // Get call history by call ID (from Bolna API)
  async getByCallId(callId) {
    return await CallHistory.findOne({ callId });
  }

  // Get call history by execution ID (from Bolna API)
  async getByExecutionId(executionId) {
    return await CallHistory.findOne({ executionId });
  }

  // Get call history by run ID (from Bolna API)
  async getByRunId(runId) {
    return await CallHistory.findOne({ runId });
  }

  // Update call history with webhook data (recording details)
  async updateByCallId(callId, updateData) {
    return await CallHistory.findOneAndUpdate(
      { callId },
      updateData,
      { new: true }
    );
  }

  // Update by ID
  async updateById(id, updateData) {
    return await CallHistory.findByIdAndUpdate(id, updateData, { new: true });
  }

  // Get recent calls for a user with pagination
  async getRecentCalls(userId, page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;
    const calls = await CallHistory.find({ userId })
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(skip)
      .populate('leadId')
      .populate('phoneNumberId')
      .populate('assistantId');
    
    const total = await CallHistory.countDocuments({ userId });
    
    return {
      calls,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  // Get calls by status
  async getByUserAndStatus(userId, status) {
    return await CallHistory.find({ userId, status })
      .sort({ createdAt: -1 })
      .populate('leadId')
      .populate('assistantId');
  }

  // Get calls with recordings (for analytics)
  async getCallsWithRecordings(userId) {
    return await CallHistory.find({
      userId,
      recordingUrl: { $ne: null },
    })
      .sort({ createdAt: -1 })
      .populate('leadId');
  }
}

module.exports = new CallHistoryRepository();
