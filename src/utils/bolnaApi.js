/**
 * Bolna API Utilities
 * Handles all interactions with Bolna API
 */

const axios = require('axios');

const BOLNA_API_URL = process.env.BOLNA_API_URL || 'https://api.bolna.ai';

class BolnaApiService {
  /**
   * Fetch execution details from Bolna
   * https://api.bolna.ai/executions/{execution_id}
   */
  async fetchExecutionDetails(executionId, bearerToken) {
    try {
      if (!executionId || !bearerToken) {
        return {
          success: false,
          error: 'executionId and bearerToken are required'
        };
      }

      const response = await axios.get(
        `${BOLNA_API_URL}/executions/${executionId}`,
        {
          headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      console.log(`Bolna Execution Details (${executionId}):`, JSON.stringify(response.data, null, 2));

      if (response.status === 200) {
        return {
          success: true,
          data: response.data,
          executionId: executionId
        };
      }

      return {
        success: false,
        error: 'Unexpected response from Bolna executions API',
        details: response.data
      };
    } catch (error) {
      console.error(`Error fetching execution details for ${executionId}:`, error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch execution details',
        executionId: executionId
      };
    }
  }

  /**
   * Make initial call to Bolna API
   * This returns execution_id (not call_id)
   */
  async makeCallToBolna(payload, bearerToken) {
    try {
      if (!bearerToken) {
        return {
          success: false,
          error: 'Bolna API bearer token is not provided'
        };
      }

      const response = await axios.post(
        `${BOLNA_API_URL}/call`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      console.log('Bolna Call Initiation Response:', JSON.stringify(response.data, null, 2));

      if (response.status === 200 || response.status === 201) {
        // Bolna returns execution_id, run_id in the initial response
        const executionId = response.data.execution_id || response.data.run_id;
        const status = response.data.status || 'queued';
        
        return {
          success: true,
          executionId: executionId,
          runId: response.data.run_id,
          status: status,
          message: response.data.message,
          initialResponse: response.data
        };
      }

      return {
        success: false,
        error: 'Unexpected response from Bolna API',
        details: response.data
      };
    } catch (error) {
      console.error('Bolna API call error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to connect to Bolna API',
        statusCode: error.response?.status
      };
    }
  }

  /**
   * Extract call details from execution response
   * Handles different formats from Bolna
   */
  extractCallDetailsFromExecution(executionData) {
    try {
      if (!executionData) {
        console.warn('No execution data provided for extraction');
        return null;
      }

      // Extract call ID (try multiple formats)
      const callId = executionData.call_id || executionData.callId || executionData.id || null;
      console.log(`Extracted callId: ${callId} (from execution_id: ${executionData.id})`);

      // Extract recording URL from telephony_data (Bolna's actual structure)
      let recordingUrl = null;
      if (executionData.telephony_data?.recording_url) {
        recordingUrl = executionData.telephony_data.recording_url;
      } else if (executionData.recording_url) {
        recordingUrl = executionData.recording_url;
      }
      console.log(`Extracted recordingUrl: ${recordingUrl}`);

      // Extract duration from telephony_data or direct
      let duration = null;
      if (executionData.telephony_data?.duration) {
        duration = parseInt(executionData.telephony_data.duration) || null;
      } else if (executionData.duration) {
        duration = executionData.duration;
      } else if (executionData.conversation_duration) {
        duration = executionData.conversation_duration;
      }
      console.log(`Extracted duration: ${duration}`);

      // Extract phone numbers from context or direct
      let recipientPhoneNumber = null;
      if (executionData.context_details?.recipient_phone_number) {
        recipientPhoneNumber = executionData.context_details.recipient_phone_number;
      } else if (executionData.recipient_phone_number) {
        recipientPhoneNumber = executionData.recipient_phone_number;
      } else if (executionData.telephony_data?.to_number) {
        recipientPhoneNumber = executionData.telephony_data.to_number;
      }
      console.log(`Extracted recipientPhoneNumber: ${recipientPhoneNumber}`);

      let phoneNumberId = null;
      if (executionData.user_number) {
        phoneNumberId = executionData.user_number;
      } else if (executionData.from_phone_number) {
        phoneNumberId = executionData.from_phone_number;
      } else if (executionData.telephony_data?.from_number) {
        phoneNumberId = executionData.telephony_data.from_number;
      }
      console.log(`Extracted phoneNumberId: ${phoneNumberId}`);

      const extracted = {
        callId: callId,
        executionId: executionData.execution_id || executionData.id || null,
        status: executionData.status || null,
        recordingUrl: recordingUrl,
        recordingId: executionData.recording_id || executionData.recordingId || null,
        duration: duration,
        agentId: executionData.agent_id || executionData.agentId || null,
        phoneNumberId: phoneNumberId,
        recipientPhoneNumber: recipientPhoneNumber,
        conversationDuration: executionData.conversation_duration || 0,
        telephonyData: executionData.telephony_data || null,
        contextDetails: executionData.context_details || null,
        fullData: executionData
      };

      console.log('Extracted call details:', JSON.stringify(extracted, null, 2));
      return extracted;
    } catch (error) {
      console.error('Error extracting call details from execution:', error);
      return null;
    }
  }
}

module.exports = new BolnaApiService();
