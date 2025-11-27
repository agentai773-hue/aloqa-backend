const callHistoryRepository = require('../repositories/callHistoryRepository');

class CallHistoryService {
  // Save initial call record when call is initiated
  async saveCallHistory(callData) {
    try {
      const recordData = {
        userId: callData.userId,
        leadId: callData.leadId || null,
        agentId: callData.agentId,
        phoneNumberId: callData.phoneNumberId || null,
        recipientPhoneNumber: callData.recipientPhoneNumber,
        callerName: callData.callerName || null,
        assistantId: callData.assistantId || null,
        status: callData.status || 'initiated',
        callId: callData.callId || null,
        executionId: callData.executionId || null,
        runId: callData.runId || null,
        webhookUrl: callData.webhookUrl,
        projectName: callData.projectName || null,
        bolnaResponse: callData.bolnaResponse || {},
        executionDetails: callData.executionDetails || null,
      };

      console.log('Creating CallHistory record with data:', JSON.stringify(recordData, null, 2));

      const historyRecord = await callHistoryRepository.create(recordData);
      
      console.log('CallHistory record created successfully:', historyRecord._id);
      return historyRecord;
    } catch (error) {
      console.error('Error saving call history:', error);
      throw new Error(`Failed to save call history: ${error.message}`);
    }
  }

  // Get all call history for a user with pagination
  async getUserCallHistory(userId, page = 1, pageSize = 10) {
    try {
      const result = await callHistoryRepository.getRecentCalls(userId, page, pageSize);
      return result;
    } catch (error) {
      console.error('Error fetching user call history:', error);
      throw new Error(`Failed to fetch call history: ${error.message}`);
    }
  }

  // Get call history for a specific lead
  async getLeadCallHistory(leadId) {
    try {
      const history = await callHistoryRepository.getByLeadId(leadId);
      return history;
    } catch (error) {
      console.error('Error fetching lead call history:', error);
      throw new Error(`Failed to fetch lead call history: ${error.message}`);
    }
  }

  // Update call history with execution details (from Bolna executions API)
  async updateCallWithExecutionDetails(executionId, executionDetails) {
    try {
      const existingCall = await callHistoryRepository.getByExecutionId(executionId);
      
      if (!existingCall) {
        console.warn(`Call with execution ID ${executionId} not found`);
        return null;
      }

      const updateData = {
        status: executionDetails.status || existingCall.status,
        callDuration: executionDetails.duration || 0,
        recordingUrl: executionDetails.recordingUrl || null,
        recordingId: executionDetails.recordingId || null,
        callId: executionDetails.callId || existingCall.callId,
        executionDetails: executionDetails,
      };

      const updatedCall = await callHistoryRepository.updateById(existingCall._id, updateData);
      return updatedCall;
    } catch (error) {
      console.error('Error updating call with execution details:', error);
      throw new Error(`Failed to update call: ${error.message}`);
    }
  }

  // Update call with webhook data (recording details from Bolna)
  async updateCallWithWebhookData(callId, webhookData) {
    try {
      const existingCall = await callHistoryRepository.getByCallId(callId);
      
      if (!existingCall) {
        console.warn(`Call with ID ${callId} not found`);
        return null;
      }

      // Extract recording URL from different possible locations in Bolna webhook
      let recordingUrl = null;
      if (webhookData.telephony_data?.recording_url) {
        recordingUrl = webhookData.telephony_data.recording_url;
      } else if (webhookData.recording_url) {
        recordingUrl = webhookData.recording_url;
      }

      // Extract duration from different possible locations
      let callDuration = 0;
      if (webhookData.telephony_data?.duration) {
        callDuration = parseInt(webhookData.telephony_data.duration) || 0;
      } else if (webhookData.duration) {
        callDuration = webhookData.duration;
      } else if (webhookData.conversation_duration) {
        callDuration = webhookData.conversation_duration;
      }

      const updateData = {
        status: webhookData.status || existingCall.status,
        callDuration: callDuration,
        recordingUrl: recordingUrl,
        recordingId: webhookData.recording_id || webhookData.recordingId || null,
        webhookData: webhookData,
      };

      console.log(`Updating call ${callId} with webhook data:`, JSON.stringify(updateData, null, 2));

      const updatedCall = await callHistoryRepository.updateByCallId(callId, updateData);
      console.log(`Call ${callId} updated successfully`);
      return updatedCall;
    } catch (error) {
      console.error('Error updating call with webhook data:', error);
      throw new Error(`Failed to update call: ${error.message}`);
    }
  }

  // Get calls with recordings
  async getCallsWithRecordings(userId) {
    try {
      const calls = await callHistoryRepository.getCallsWithRecordings(userId);
      return calls;
    } catch (error) {
      console.error('Error fetching calls with recordings:', error);
      throw new Error(`Failed to fetch calls with recordings: ${error.message}`);
    }
  }

  // Get calls by status
  async getCallsByStatus(userId, status) {
    try {
      const calls = await callHistoryRepository.getByUserAndStatus(userId, status);
      return calls;
    } catch (error) {
      console.error(`Error fetching calls with status ${status}:`, error);
      throw new Error(`Failed to fetch calls: ${error.message}`);
    }
  }

  // Get single call details
  async getCallDetails(callId) {
    try {
      const call = await callHistoryRepository.getByCallId(callId);
      if (!call) {
        throw new Error('Call not found');
      }
      return call;
    } catch (error) {
      console.error('Error fetching call details:', error);
      throw new Error(`Failed to fetch call details: ${error.message}`);
    }
  }

  // Update call status (used by polling service)
  async updateCallStatus(callId, updateData) {
    try {
      const updatedCall = await callHistoryRepository.updateById(callId, updateData);
      return updatedCall;
    } catch (error) {
      console.error('Error updating call status:', error);
      throw new Error(`Failed to update call status: ${error.message}`);
    }
  }
}

module.exports = new CallHistoryService();
