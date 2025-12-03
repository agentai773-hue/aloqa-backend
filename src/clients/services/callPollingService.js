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
   * Also emits WebSocket status updates during polling
   * 
   * NOTE: maxDuration defaults to 180000ms (3 minutes) because:
   * - Most calls complete within 2-3 minutes
   * - Bolna sometimes reports stale status for calls that user hung up
   * - After 3 minutes, we trust that status is "connected" (call is ongoing)
   * - Polling beyond this causes incorrect "busy" status to appear later
   */
  async startPollingExecution(executionId, leadId, userId, maxDuration = 180000) {
    try {
      console.log(`📊 Polling execution_id=${executionId} for lead_id=${leadId} (max ${maxDuration}ms)`);

      const user = await User.findById(userId);
      if (!user || !user.bearerToken) {
        console.error(`❌ Bearer token not found for userId=${userId}`);
        return;
      }

      const startTime = Date.now();
      let pollAttempt = 0;
      const pollInterval = 3000; // 3 seconds - check more frequently for real-time updates
      let lastEmittedStatus = null; // Track last emitted status to avoid duplicates
      
      const webSocketService = require('../websocket/services/webSocketService');

      return new Promise((resolve) => {
        const pollTimer = setInterval(async () => {
          try {
            pollAttempt++;

            // Check if max duration exceeded
            if (Date.now() - startTime > maxDuration) {
              console.log(`⏱️  Max polling duration exceeded (${maxDuration}ms) for execution ${executionId}`);
              console.log(`⏱️  Assuming call is complete - stopping polling and keeping current status as "connected"`);
              clearInterval(pollTimer);
              
              // Mark as called but keep status as "connected" (most accurate for long calls)
              try {
                const Lead = require('../../models/Lead');
                await Lead.findByIdAndUpdate(
                  leadId,
                  {
                    $set: {
                      call_status: 'connected',  // Keep as connected (user likely still on call or just hung up)
                      has_been_called: true,     // Mark as called
                      last_auto_call_attempt: new Date()
                    }
                  },
                  { new: true, runValidators: false }
                );
                console.log(`✅ Lead ${leadId} marked as called with final status: connected`);
              } catch (updateError) {
                console.error(`❌ Error updating lead after timeout:`, updateError.message);
              }
              
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

            // 🚀 EMIT STATUS UPDATES via WebSocket during polling
            // This gives real-time updates to frontend even while call is in progress
            if (currentStatus !== lastEmittedStatus) {
              try {
                // Map Bolna status to our status - PRESERVE ACTUAL STATUS
                let ourStatus = currentStatus;
                if (currentStatus === 'ringing' || currentStatus === 'in-progress') {
                  ourStatus = 'connected';
                } else if (currentStatus === 'completed' || currentStatus === 'failed') {
                  ourStatus = 'completed';
                } else if (currentStatus === 'busy') {
                  ourStatus = 'busy'; // ✅ Keep "busy" as is - don't convert to connected
                } else if (currentStatus === 'failed-invalid') {
                  ourStatus = 'not_connected';
                }
                
                webSocketService.emitCallStatusUpdate(
                  userId.toString(),
                  leadId.toString(),
                  ourStatus,
                  {
                    executionId: executionId,
                    bolnaStatus: currentStatus,
                    timestamp: new Date().toISOString(),
                  }
                );
                console.log(`📡 [WebSocket] Status update emitted during polling: ${ourStatus}`);
                lastEmittedStatus = currentStatus;
              } catch (wsError) {
                console.warn('⚠️  [WebSocket] Error emitting status during polling:', wsError.message);
              }
            }

            // Check if completed (including busy which is a final status)
            if (currentStatus === 'completed' || currentStatus === 'failed' || currentStatus === 'failed-invalid' || currentStatus === 'busy') {
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
      } else if (status === 'busy') {
        ourCallStatus = 'busy'; // ✅ Keep busy status as is
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
      // 🔴 IMPORTANT: Mark lead as called for ALL final statuses (completed, busy, not_connected, etc)
      // So it won't be called again today - only next day when reset happens
      const lead = await Lead.findByIdAndUpdate(
        leadId,
        { 
          $set: { 
            call_status: ourCallStatus,
            has_been_called: true,  // ✅ Mark as called regardless of final status
            last_call_attempt: new Date()
          } 
        },
        { new: true }
      );

      console.log(`✅ Lead ${leadId} status updated to "${ourCallStatus}"`);
      console.log(`🔒 Lead marked as has_been_called=true (won't be called again until reset)`);
      console.log(`📌 Lead call_status is now: ${lead.call_status}`);

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
