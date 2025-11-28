/**
 * Call Status Polling Service
 * Periodically checks Bolna for call status updates and saves to database
 * Handles recording URL extraction when call completes
 */

const bolnaApiService = require('../../utils/bolnaApi');
const callHistoryService = require('./callHistoryService');
const CallRepository = require('../repositories/callRepository');

class CallStatusPollingService {
  constructor() {
    this.repository = new CallRepository();
    this.isRunning = false;
    this.pollingInterval = null;
  }

  /**
   * Start the polling service
   * Runs every 30 seconds to check pending calls
   */
  startPolling() {
    if (this.isRunning) {
      console.log('Call status polling already running');
      return;
    }

    this.isRunning = true;
    console.log('🔄 Starting call status polling service (every 30 seconds)');

    // Run immediately, then every 30 seconds
    this.pollCallStatuses();

    this.pollingInterval = setInterval(() => {
      this.pollCallStatuses();
    }, 30000); // 30 seconds
  }

  /**
   * Stop the polling service
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.isRunning = false;
      console.log('✋ Stopped call status polling service');
    }
  }

  /**
   * Poll all pending calls and update their status
   */
  async pollCallStatuses() {
    try {
      // Get all calls that are still pending (not completed/failed)
      const pendingCalls = await this.repository.getPendingCalls();

      if (pendingCalls.length === 0) {
        return; // No pending calls, nothing to do
      }

      console.log(`\n📞 Polling ${pendingCalls.length} pending calls for status updates...`);

      for (const call of pendingCalls) {
        await this.checkAndUpdateCallStatus(call);
      }
    } catch (error) {
      console.error('Error in pollCallStatuses:', error);
    }
  }

  /**
   * Check status of a single call and update if changed
   */
  async checkAndUpdateCallStatus(call) {
    try {
      const { executionId, callId, userId } = call;

      // Need bearer token for Bolna API
      const bearerToken = await this.repository.getUserBearerToken(userId);
      
      if (!bearerToken) {
        console.warn(`No bearer token for user ${userId}, skipping call ${executionId}`);
        return;
      }

      // Fetch latest execution details from Bolna
      const executionResponse = await bolnaApiService.fetchExecutionDetails(
        executionId,
        bearerToken
      );

      if (!executionResponse.success || !executionResponse.data) {
        console.log(`⚠️ Could not fetch execution ${executionId}`);
        return;
      }

      const executionData = executionResponse.data;
      const newStatus = executionData.status;

      // Extract call details (recording URL, duration, etc)
      const callDetails = bolnaApiService.extractCallDetailsFromExecution(executionData);

      // Check if status changed
      const statusChanged = call.status !== newStatus;

      if (statusChanged) {
        console.log(`✏️ Call ${executionId} status: ${call.status} → ${newStatus}`);
      }

      // If call is completed or failed, or we have new recording data, update it
      if (statusChanged || callDetails.recordingUrl) {
        const updateData = {
          status: newStatus,
          callDuration: callDetails.duration || 0,
          recordingUrl: callDetails.recordingUrl || null,
          recordingId: callDetails.recordingId || null,
          phoneNumberId: callDetails.phoneNumberId || call.phoneNumberId,
          recipientPhoneNumber: callDetails.recipientPhoneNumber || call.recipientPhoneNumber,
          conversationTranscript: callDetails.conversationTranscript || null,
          conversationMessages: callDetails.conversationMessages || [],
          executionDetails: executionData,
          lastStatusCheck: new Date(),
          lastStatusCheckResponse: {
            status: newStatus,
            recordingUrl: callDetails.recordingUrl,
            duration: callDetails.duration
          }
        };

        // Update the call in database
        const updated = await callHistoryService.updateCallStatus(
          call._id,
          updateData
        );

        if (updated) {
          console.log(`✅ Updated call ${executionId} - Status: ${newStatus}, Recording: ${callDetails.recordingUrl ? '✓' : '✗'}`);
          
          // Update lead call status if call is completed
          if (newStatus === 'completed' && call.leadId) {
            try {
              await callHistoryService.updateLeadCallStatus(call.leadId, 'completed');
              console.log(`📞 Updated lead ${call.leadId} call status to completed`);
              
              // Extract and create site visit from transcript if available
              if (callDetails.conversationTranscript) {
                try {
                  const siteVisitService = require('./siteVisitService');
                  console.log('📍 Attempting to extract site visit from transcript (polling)...');
                  
                  const siteVisitResult = await siteVisitService.extractAndCreateSiteVisit(
                    call.leadId.toString(),
                    call._id.toString(),
                    callDetails.conversationTranscript
                  );

                  if (siteVisitResult.success) {
                    console.log('✅ Site visit created from transcript (polling):', siteVisitResult.data);
                  } else {
                    console.log('ℹ️ No site visit info in transcript:', siteVisitResult.message);
                  }
                } catch (siteVisitError) {
                  console.warn('⚠️ Error extracting site visit from polling (non-blocking):', siteVisitError.message);
                }
              }
            } catch (err) {
              console.error(`Error updating lead ${call.leadId}:`, err.message);
            }
          }
        }

        // Log status progression for debugging
        if (statusChanged) {
          console.log(`  Duration: ${callDetails.duration || 0}s, Recording: ${callDetails.recordingUrl || 'Not available'}`);
        }
      }
    } catch (error) {
      console.error(`Error checking call ${call.executionId}:`, error.message);
    }
  }

  /**
   * Manually trigger a status check for a specific call
   */
  async checkCallStatus(callId) {
    try {
      const call = await this.repository.getCallById(callId);
      
      if (!call) {
        return { success: false, message: 'Call not found' };
      }

      await this.checkAndUpdateCallStatus(call);

      // Return updated call data
      const updated = await this.repository.getCallById(callId);
      return {
        success: true,
        data: updated
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}

module.exports = new CallStatusPollingService();
