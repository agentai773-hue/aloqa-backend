/**
 * Call Status Polling Service
 * NO LONGER USES POLLING - Now uses WEBHOOK + CRON JOBS ONLY
 * 
 * This service is kept ONLY for:
 * 1. Safety check for stalled calls (runs via cron job daily at 3 PM)
 * 2. Manual status checks (when user explicitly requests)
 * 
 * NO POLLING ANYMORE - All real-time updates via webhook callbacks
 */

const bolnaApiService = require('../utils/bolnaApi');
const callHistoryService = require('./callHistoryService');
const CallRepository = require('../repositories/callRepository');

class CallStatusPollingService {
  constructor() {
    this.repository = new CallRepository();
  }


  async safetyCheckStalledCalls() {
    try {
      console.log('🔍 Safety check: Looking for stalled calls (no webhook callback for 1+ hour)...');

      // Find calls that are still "in_progress" but haven't been updated in 1+ hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const CallHistory = require('../../models/CallHistory');
      const stalledCalls = await CallHistory.find({
        status: { $in: ['in_progress', 'initiated'] },
        lastStatusCheck: { $lt: oneHourAgo },
      });

      if (stalledCalls.length === 0) {
        console.log('✅ No stalled calls found');
        return { success: true, checked: 0, updated: 0 };
      }

      console.log(`⚠️  Found ${stalledCalls.length} stalled calls - checking Bolna for status...`);

      let updatedCount = 0;
      for (const call of stalledCalls) {
        try {
          await this.checkAndUpdateCallStatus(call);
          updatedCount++;
        } catch (err) {
          console.error(`Error checking stalled call ${call.executionId}:`, err.message);
        }
      }

      console.log(`✅ Safety check complete: checked ${stalledCalls.length}, updated ${updatedCount}`);
      return { success: true, checked: stalledCalls.length, updated: updatedCount };
    } catch (error) {
      console.error('Error in safetyCheckStalledCalls:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check status of a single call and update if changed
   * Used only by safety check and manual status checks
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
          
          // 🚀 EMIT WEBSOCKET EVENT FOR REAL-TIME CALL STATUS UPDATE
          try {
            const webSocketService = require('../websocket/services/webSocketService');
            
            // Emit call status update
            webSocketService.emitCallStatusUpdate(
              call.userId.toString(),
              call.leadId.toString(),
              newStatus,
              {
                callId: call.callId,
                duration: callDetails.duration,
                recordingUrl: callDetails.recordingUrl,
                timestamp: new Date().toISOString(),
              }
            );
            console.log(`📡 [WebSocket] Call status update emitted via polling - ${newStatus}`);

            // Map call status to lead status
            let leadCallStatus = 'pending';
            if (newStatus === 'connected' || newStatus === 'in-progress') {
              leadCallStatus = 'connected';
            } else if (newStatus === 'completed') {
              leadCallStatus = 'completed';
            } else if (newStatus === 'failed' || newStatus === 'cancelled') {
              leadCallStatus = 'not_connected';
            }

            // Emit lead status changed event
            webSocketService.emitLeadStatusChanged(
              call.userId.toString(),
              call.leadId.toString(),
              { call_status: leadCallStatus },
              `call_${leadCallStatus}`
            );
            console.log(`📡 [WebSocket] Lead status changed to "${leadCallStatus}" - emitted via polling`);
          } catch (wsError) {
            console.warn(`⚠️  [WebSocket] Error emitting polling events (non-blocking):`, wsError.message);
          }
          
          // Update lead call status if call is completed
          if (newStatus === 'completed' && call.leadId) {
            try {
              await callHistoryService.updateLeadCallStatus(call.leadId, 'completed');
              console.log(`📞 Updated lead ${call.leadId} call status to completed`);
              
              // Extract and create site visit from transcript if available
              if (callDetails.conversationTranscript) {
                try {
                  const siteVisitService = require('./siteVisitService');
                  console.log('📍 Attempting to extract site visit from transcript (safety check)...');
                  
                  const siteVisitResult = await siteVisitService.extractAndCreateSiteVisit(
                    call.leadId.toString(),
                    call._id.toString(),
                    callDetails.conversationTranscript
                  );

                  if (siteVisitResult.success) {
                    console.log('✅ Site visit created from transcript (safety check):', siteVisitResult.data);
                  } else {
                    console.log('ℹ️ No site visit info in transcript:', siteVisitResult.message);
                  }
                } catch (siteVisitError) {
                  console.warn('⚠️ Error extracting site visit from safety check (non-blocking):', siteVisitError.message);
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
   * Used when user explicitly requests status update
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