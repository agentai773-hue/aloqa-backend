const callHistoryService = require('../services/callHistoryService');
const callStatusPollingService = require('../services/callStatusPollingService');
const transcriptAnalysisService = require('../services/transcriptAnalysisService');

class CallHistoryController {
  // Get all call history for logged-in user with optional filters
  async getCallHistory(req, res) {
    try {
      const userId = req.user._id;
      const { page = 1, pageSize = 10, status = 'all', assistantId = 'all' } = req.query;

      // Build filters object
      const filters = {};
      if (status && status !== 'all') {
        filters.status = status;
      }
      if (assistantId && assistantId !== 'all') {
        filters.assistantId = assistantId;
      }

      console.log('getCallHistory - Filters:', filters);

      const result = await callHistoryService.getUserCallHistory(
        userId,
        parseInt(page),
        parseInt(pageSize),
        filters
      );

      return res.status(200).json({
        success: true,
        data: result.calls,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('Error in getCallHistory:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch call history',
      });
    }
  }

  // Get call history for a specific lead
  async getCallHistoryByLead(req, res) {
    try {
      const { leadId } = req.params;

      if (!leadId) {
        return res.status(400).json({
          success: false,
          message: 'Lead ID is required',
        });
      }

      const history = await callHistoryService.getLeadCallHistory(leadId);

      return res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      console.error('Error in getCallHistoryByLead:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch lead call history',
      });
    }
  }

  // Webhook endpoint - receive call data from Bolna API
  async handleCallWebhook(req, res) {
    try {
      const webhookData = req.body;

      console.log('\n📍📍📍 WEBHOOK RECEIVED FROM BOLNA 📍📍📍');
      console.log('Full webhook payload:', JSON.stringify(webhookData, null, 2));

      // Extract call ID from webhook payload (try multiple formats)
      const callId = webhookData.call_id || webhookData.callId || webhookData.id;
      const executionId = webhookData.execution_id || webhookData.executionId;

      console.log(`🔍 Looking for call - callId: ${callId}, executionId: ${executionId}`);

      if (!callId && !executionId) {
        console.warn('⚠️  No call ID or execution ID in webhook data');
        return res.status(400).json({
          success: false,
          message: 'Call ID or Execution ID is required in webhook data',
        });
      }

      // Update call history with webhook data
      // First try by callId, then by executionId
      let updatedCall = null;
      
      if (callId) {
        console.log(`⏳ Attempting to update call with callId: ${callId}`);
        updatedCall = await callHistoryService.updateCallWithWebhookData(
          callId,
          webhookData
        );
      }
      
      if (!updatedCall && executionId) {
        console.log(`⏳ Call not found by callId, trying executionId: ${executionId}`);
        // Update by execution ID instead
        updatedCall = await callHistoryService.updateCallWithExecutionDetails(
          executionId,
          webhookData
        );
      }

      if (updatedCall) {
        console.log(`✅ Call history updated with webhook - ID: ${updatedCall?._id}`);
        console.log(`📌 updatedCall.leadId:`, updatedCall.leadId);
        console.log(`📌 updatedCall.userId:`, updatedCall.userId);
        console.log(`📌 updatedCall.status:`, updatedCall.status);

        // Map CallHistory status to Lead call_status for frontend display
        // CallHistory has: initiated, queued, ringing, connected, in-progress, completed, failed, cancelled
        // Lead needs: pending, connected, not_connected, callback, completed, scheduled
        if (updatedCall.leadId) {
          let leadCallStatus = 'pending';
          
          if (updatedCall.status === 'connected' || updatedCall.status === 'in-progress') {
            leadCallStatus = 'connected';  // Call is active
          } else if (updatedCall.status === 'completed') {
            leadCallStatus = 'completed';  // Call finished
          } else if (updatedCall.status === 'failed' || updatedCall.status === 'cancelled') {
            leadCallStatus = 'not_connected';  // Call failed
          } else if (updatedCall.status === 'initiated' || updatedCall.status === 'queued' || updatedCall.status === 'ringing') {
            leadCallStatus = 'connected';  // Call is attempting
          }
          
          console.log(`🔄 Mapping CallHistory status "${updatedCall.status}" → Lead call_status "${leadCallStatus}"`);
          
          // Update Lead's call_status so frontend shows real-time updates
          try {
            const Lead = require('../../models/Lead');
            const updatedLead = await Lead.findByIdAndUpdate(
              updatedCall.leadId,
              { call_status: leadCallStatus },
              { new: true }
            );
            console.log(`✅ Lead ${updatedCall.leadId} call_status updated to: ${leadCallStatus}`);
            console.log(`✅ Updated Lead data:`, { _id: updatedLead._id, call_status: updatedLead.call_status });

            // 🚀 EMIT WEBSOCKET EVENT FOR REAL-TIME STATUS UPDATE
            try {
              const webSocketService = require('../websocket/services/webSocketService');
              
              webSocketService.emitLeadStatusChanged(
                updatedCall.userId.toString(),
                updatedCall.leadId.toString(),
                { call_status: leadCallStatus },
                `call_${leadCallStatus}`
              );
              console.log(`📡 [WebSocket] Lead status changed to "${leadCallStatus}" - emitted via webhook`);

              // Also emit call status update event
              webSocketService.emitCallStatusUpdate(
                updatedCall.userId.toString(),
                updatedCall.leadId.toString(),
                updatedCall.status,
                {
                  callId: updatedCall.callId,
                  duration: updatedCall.callDuration,
                  recordingUrl: updatedCall.recordingUrl,
                  timestamp: new Date().toISOString(),
                }
              );
              console.log(`📡 [WebSocket] Call status update emitted - ${updatedCall.status}`);
            } catch (wsError) {
              console.warn(`⚠️  [WebSocket] Error emitting events (non-blocking):`, wsError.message);
            }
          } catch (error) {
            console.error(`❌ Could not update Lead call_status:`, error.message);
            console.error(`❌ Full error:`, error);
          }
        } else {
          console.warn(`⚠️  updatedCall.leadId is missing - cannot update Lead call_status`);
        }

        // Analyze transcript if call is completed
        if (updatedCall.status === 'completed') {
          console.log('🔍 Analyzing call transcript...');
          const analysisResult = await transcriptAnalysisService.analyzeTranscript(updatedCall._id);
          
          if (analysisResult.success) {
            console.log('✅ Transcript analyzed:', analysisResult.leadType);
          }
        }


      } else {
        console.warn(`❌ Could not find call to update - callId: ${callId}, executionId: ${executionId}`);
      }

      // Respond to Bolna API
      return res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
      });
    } catch (error) {
      console.error('❌ Error in handleCallWebhook:', error);
      // Still return 200 to acknowledge receipt to Bolna
      return res.status(200).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get calls with recordings
  async getCallsWithRecordings(req, res) {
    try {
      const userId = req.user._id;

      const calls = await callHistoryService.getCallsWithRecordings(userId);

      return res.status(200).json({
        success: true,
        data: calls,
      });
    } catch (error) {
      console.error('Error in getCallsWithRecordings:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch calls with recordings',
      });
    }
  }

  // Get call details
  async getCallDetails(req, res) {
    try {
      const { callId } = req.params;

      if (!callId) {
        return res.status(400).json({
          success: false,
          message: 'Call ID is required',
        });
      }

      const call = await callHistoryService.getCallDetails(callId);

      return res.status(200).json({
        success: true,
        data: call,
      });
    } catch (error) {
      console.error('Error in getCallDetails:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch call details',
      });
    }
  }

  // Manually check and update call status from Bolna
  async checkCallStatus(req, res) {
    try {
      const { callId } = req.params;

      if (!callId) {
        return res.status(400).json({
          success: false,
          message: 'Call ID is required',
        });
      }

      const result = await callStatusPollingService.checkCallStatus(callId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Call status checked and updated',
        data: result.data,
      });
    } catch (error) {
      console.error('Error in checkCallStatus:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to check call status',
      });
    }
  }

  // Search call history by callerName, recipientPhoneNumber, or projectName with optional filters
  async searchCallHistory(req, res) {
    try {
      const userId = req.user._id;
      const { searchTerm = '', page = 1, pageSize = 10, status = 'all', assistantId = 'all' } = req.body;

      // Build filters object
      const filters = {};
      if (status && status !== 'all') {
        filters.status = status;
      }
      if (assistantId && assistantId !== 'all') {
        filters.assistantId = assistantId;
      }

      console.log('Search parameters:', { searchTerm, page, pageSize, status, assistantId, filters });

      const result = await callHistoryService.searchCalls(
        userId,
        searchTerm ? searchTerm.trim() : '',
        parseInt(page),
        parseInt(pageSize),
        filters
      );

      return res.status(200).json({
        success: true,
        data: result.calls,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('Error in searchCallHistory:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to search call history',
      });
    }
  }
}

module.exports = new CallHistoryController();
