const callHistoryService = require('../services/callHistoryService');
const callStatusPollingService = require('../services/callStatusPollingService');

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

      console.log('Received webhook from Bolna:', JSON.stringify(webhookData, null, 2));

      // Extract call ID from webhook payload (try multiple formats)
      const callId = webhookData.call_id || webhookData.callId || webhookData.id;
      const executionId = webhookData.execution_id || webhookData.executionId;

      if (!callId && !executionId) {
        return res.status(400).json({
          success: false,
          message: 'Call ID or Execution ID is required in webhook data',
        });
      }

      // Update call history with webhook data
      // First try by callId, then by executionId
      let updatedCall = null;
      
      if (callId) {
        updatedCall = await callHistoryService.updateCallWithWebhookData(
          callId,
          webhookData
        );
      }
      
      if (!updatedCall && executionId) {
        console.log(`Call not found by callId, trying executionId: ${executionId}`);
        // Update by execution ID instead
        updatedCall = await callHistoryService.updateCallWithExecutionDetails(
          executionId,
          webhookData
        );
      }

      if (updatedCall) {
        console.log('Call history updated with webhook data:', updatedCall?._id);
      } else {
        console.warn(`Could not find call to update - callId: ${callId}, executionId: ${executionId}`);
      }

      // Respond to Bolna API
      return res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
      });
    } catch (error) {
      console.error('Error in handleCallWebhook:', error);
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
