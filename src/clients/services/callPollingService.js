/**
 * Call Polling Service
 * Polls Bolna execution API to check when call completes
 * Updates lead status when call is finished
 */

const callHistoryRepository = require('../repositories/callHistoryRepository');
const callHistoryService = require('./callHistoryService');
const bolnaApiService = require('../utils/bolnaApi');
const User = require('../../models/User');
const Lead = require('../../models/Lead');

class CallPollingService {
  constructor() {
    // callHistoryRepository is already a singleton instance
    this.callHistoryRepository = callHistoryRepository;
    this.activePolls = new Map(); // Track active polling operations
  }

  /**
   * Start polling a specific execution until it completes
   * Called after initiating a call to wait for completion
   */
  async startPollingExecution(executionId, leadId, userId, maxDuration = 600000) {
    try {
      console.log(`📊 Polling execution_id=${executionId} for lead_id=${leadId}`);

      const user = await User.findById(userId);
      if (!user || !user.bearerToken) {
        console.error(`❌ Bearer token not found for userId=${userId}`);
        return;
      }

      const startTime = Date.now();
      let pollAttempt = 0;
      const pollInterval = 3000; // 5 seconds

      return new Promise((resolve) => {
        const pollTimer = setInterval(async () => {
          try {
            pollAttempt++;

            // Check if max duration exceeded
            if (Date.now() - startTime > maxDuration) {
              console.log(`⏱️  Max polling duration exceeded for execution ${executionId}`);
              clearInterval(pollTimer);
              resolve(false);
              return;
            }

            // Fetch execution details
            const executionResponse = await bolnaApiService.fetchExecutionDetails(
              executionId,
              user.bearerToken
            );

            if (!executionResponse.success || !executionResponse.data) {
              return;
            }

            const execution = executionResponse.data;
            const currentStatus = execution.status;

            console.log(`🔄 Polling execution ${executionId}: ${currentStatus}`);

            // Check if completed
            if (currentStatus === 'completed' || currentStatus === 'failed' || currentStatus === 'failed-invalid') {
              console.log(`✅ Execution ${executionId} completed: ${currentStatus}`);
              clearInterval(pollTimer);

              await this.handleExecutionComplete(execution, leadId, userId);
              resolve(true);
              return;
            }
          } catch (pollError) {
            console.error(`❌ Polling error (attempt ${pollAttempt}):`, pollError.message);
          }
        }, pollInterval);
      });
    } catch (error) {
      console.error('❌ Error in startPollingExecution:', error.message);
      return false;
    }
  }

  /**
   * Handle when execution completes
   * Update call history and lead status based on final execution data
   */
  async handleExecutionComplete(executionData, leadId, userId) {
    try {
      console.log(`📍 Handling execution completion for lead_id=${leadId}`);

      const executionId = executionData.id || executionData.execution_id;
      const status = executionData.status;
      const callData = executionData.call_data || {};

      // Map Bolna statuses to our statuses
      let ourCallStatus = 'completed';
      if (status === 'failed' || status === 'failed-invalid') {
        ourCallStatus = 'not_connected';
      }

      console.log(`📊 Execution completed - Status: ${status}, Our Status: ${ourCallStatus}`);

      // Find and update CallHistory record
      const callHistory = await this.callHistoryRepository.getByExecutionId(executionId);

      if (callHistory) {
        const recordingUrl = callData.recording_url || executionData.recording_url || null;
        const transcript = callData.transcript || executionData.transcript || null;

        const updateData = {
          status: ourCallStatus,
          callDuration: callData.duration || 0,
          recordingUrl: recordingUrl,
          conversationTranscript: transcript,
          executionDetails: executionData,
        };

        await this.callHistoryRepository.updateById(callHistory._id, updateData);
        console.log(`✅ CallHistory updated for execution ${executionId}`);

        // Analyze transcript if call completed
        if (ourCallStatus === 'completed' && transcript) {
          try {
            const transcriptAnalysisService = require('./transcriptAnalysisService');
            await transcriptAnalysisService.analyzeTranscript(callHistory._id);
            console.log(`✅ Transcript analyzed`);
          } catch (analysisError) {
            console.warn(`⚠️  Error analyzing transcript:`, analysisError.message);
          }
        }
      }

      // Update lead status
      const lead = await Lead.findByIdAndUpdate(
        leadId,
        { 
          $set: { 
            call_status: ourCallStatus === 'completed' ? 'completed' : 'not_connected',
            last_call_attempt: new Date()
          } 
        },
        { new: true }
      );

      console.log(`✅ Lead ${leadId} status updated to "${ourCallStatus}"`);
      console.log(`📌 Lead call_status is now: ${lead.call_status}`);

      // Emit WebSocket event to notify frontend of status change
      try {
        const app = require('../../../app');
        const io = app?.locals?.io;
        
        if (io && userId) {
          const roomName = `user:${userId}`;
          console.log(`📡 [Polling] Emitting WebSocket event to room: ${roomName}`);
          console.log(`📡 [Polling] Event: call:status-updated | Status: ${ourCallStatus}`);
          
          // Get connected clients in the room for debugging
          const socketsInRoom = io.sockets.adapter.rooms?.get(roomName)?.size || 0;
          console.log(`📊 [Polling] Clients in room ${roomName}: ${socketsInRoom}`);
          
          io.to(roomName).emit('call:status-updated', {
            callId: callHistory?._id,
            status: ourCallStatus,
            leadId: leadId.toString(),
            leadType: lead?.lead_type,
            timestamp: new Date()
          });
          console.log(`✅ [Polling] WebSocket event emitted successfully`);
        } else {
          console.warn(`⚠️  [Polling] Could not emit WebSocket - io:${!!io}, userId:${userId}`);
        }
      } catch (wsError) {
        console.warn(`⚠️  [Polling] Error emitting WebSocket from polling service:`, wsError.message);
      }

      return true;
    } catch (error) {
      console.error('❌ Error in handleExecutionComplete:', error.message);
      return false;
    }
  }

  /**
   * Get safe call history repository
   */
  getCallHistoryRepository() {
    return this.callHistoryRepository;
  }
}

module.exports = new CallPollingService();
