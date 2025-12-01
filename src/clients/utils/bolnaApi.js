/**
 * Bolna API Service
 * Handles all interactions with Bolna API with proper error handling
 * Located in clients/utils for client-side API integration
 */

const axios = require('axios');

const BOLNA_API_URL = process.env.BOLNA_API_URL || 'https://api.bolna.ai';
const REQUEST_TIMEOUT = parseInt(process.env.BOLNA_REQUEST_TIMEOUT || '10000', 10);

class BolnaApiService {
  constructor() {
    this.client = axios.create({
      baseURL: BOLNA_API_URL,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Handle axios errors with proper categorization
   * @param {Error} error - The error object from axios
   * @param {string} operationName - Name of the operation that failed
   * @returns {Object} - Formatted error response
   */
  handleAxiosError(error, operationName) {
    const errorResponse = {
      success: false,
      operationName: operationName
    };

    if (error.response) {
      // Server responded with error status
      errorResponse.statusCode = error.response.status;
      errorResponse.error = error.response.data?.message || error.response.statusText || 'Server error';
      errorResponse.details = error.response.data;
      
      console.error(`❌ [${operationName}] Server error (${error.response.status}):`, error.response.data);
    } else if (error.code === 'ECONNABORTED') {
      // Request timeout
      errorResponse.error = `Request timeout after ${REQUEST_TIMEOUT}ms`;
      errorResponse.code = 'TIMEOUT';
      
      console.error(`❌ [${operationName}] Timeout:`, errorResponse.error);
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      // Network error - cannot reach server
      errorResponse.error = 'Network error: Unable to reach Bolna API';
      errorResponse.code = error.code;
      
      console.error(`❌ [${operationName}] Network error:`, error.message);
    } else if (error.request && !error.response) {
      // Request made but no response
      errorResponse.error = 'No response from Bolna API';
      errorResponse.code = 'NO_RESPONSE';
      
      console.error(`❌ [${operationName}] No response from server`);
    } else {
      // Client-side error
      errorResponse.error = error.message || 'Unknown error occurred';
      errorResponse.code = 'CLIENT_ERROR';
      
      console.error(`❌ [${operationName}] Client error:`, error.message);
    }

    return errorResponse;
  }

  /**
   * Fetch execution details from Bolna
   * GET https://api.bolna.ai/executions/{execution_id}
   */
  async fetchExecutionDetails(executionId, bearerToken) {
    try {
      if (!executionId || !bearerToken) {
        return {
          success: false,
          error: 'executionId and bearerToken are required'
        };
      }

      const response = await this.client.get(
        `/executions/${executionId}`,
        {
          headers: {
            'Authorization': `Bearer ${bearerToken}`
          }
        }
      );

      if (response.status === 200) {
        console.log(`✅ [fetchExecutionDetails] Success for execution ${executionId}`);
        
        return {
          success: true,
          data: response.data,
          executionId: executionId
        };
      }

      return {
        success: false,
        error: 'Unexpected response from Bolna executions API',
        statusCode: response.status,
        details: response.data
      };
    } catch (error) {
      return this.handleAxiosError(error, 'fetchExecutionDetails');
    }
  }

  /**
   * Make initial call to Bolna API
   * POST https://api.bolna.ai/call
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

      if (!payload) {
        return {
          success: false,
          error: 'Payload is required for call initialization'
        };
      }

      const response = await this.client.post(
        '/call',
        payload,
        {
          headers: {
            'Authorization': `Bearer ${bearerToken}`
          }
        }
      );

      if (response.status === 200 || response.status === 201) {
        // Bolna returns execution_id, run_id in the initial response
        const executionId = response.data.execution_id || response.data.run_id;
        const status = response.data.status || 'queued';
        
        console.log(`✅ [makeCallToBolna] Call initiated successfully. Execution ID: ${executionId}`);
        
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
        statusCode: response.status,
        details: response.data
      };
    } catch (error) {
      return this.handleAxiosError(error, 'makeCallToBolna');
    }
  }

  /**
   * Extract call details from execution response
   * Handles different formats from Bolna
   * @param {Object} executionData - The execution data from Bolna
   * @returns {Object|null} - Extracted call details or null
   */
  extractCallDetailsFromExecution(executionData) {
    try {
      if (!executionData) {
        console.warn('⚠️ No execution data provided for extraction');
        return null;
      }

      // Extract call ID (try multiple formats)
      const callId = executionData.call_id || executionData.callId || executionData.id || null;
      console.log(`📋 Extracted callId: ${callId} (from execution_id: ${executionData.id})`);

      // Extract recording URL from telephony_data (Bolna's actual structure)
      let recordingUrl = null;
      if (executionData.telephony_data?.recording_url) {
        recordingUrl = executionData.telephony_data.recording_url;
      } else if (executionData.recording_url) {
        recordingUrl = executionData.recording_url;
      }
      console.log(`🎙️ Extracted recordingUrl: ${recordingUrl ? 'Found' : 'Not found'}`);

      // Extract duration from telephony_data or direct
      let duration = null;
      if (executionData.telephony_data?.duration) {
        duration = parseInt(executionData.telephony_data.duration) || null;
      } else if (executionData.duration) {
        duration = executionData.duration;
      } else if (executionData.conversation_duration) {
        duration = executionData.conversation_duration;
      }
      console.log(`⏱️ Extracted duration: ${duration}s`);

      // Extract phone numbers from context or direct
      let recipientPhoneNumber = null;
      if (executionData.context_details?.recipient_phone_number) {
        recipientPhoneNumber = executionData.context_details.recipient_phone_number;
      } else if (executionData.recipient_phone_number) {
        recipientPhoneNumber = executionData.recipient_phone_number;
      } else if (executionData.telephony_data?.to_number) {
        recipientPhoneNumber = executionData.telephony_data.to_number;
      }
      console.log(`📱 Extracted recipientPhoneNumber: ${recipientPhoneNumber ? 'Found' : 'Not found'}`);

      let phoneNumberId = null;
      if (executionData.user_number) {
        phoneNumberId = executionData.user_number;
      } else if (executionData.from_phone_number) {
        phoneNumberId = executionData.from_phone_number;
      } else if (executionData.telephony_data?.from_number) {
        phoneNumberId = executionData.telephony_data.from_number;
      }
      console.log(`☎️ Extracted phoneNumberId: ${phoneNumberId ? 'Found' : 'Not found'}`);

      // Extract conversation transcript
      let conversationTranscript = null;
      let conversationMessages = [];

      // Try to extract conversation from multiple possible locations
      // IMPORTANT: Check for 'transcript' field first (new format from Bolna)
      if (executionData.transcript) {
        conversationTranscript = executionData.transcript;
      } else if (executionData.conversation) {
        conversationTranscript = executionData.conversation;
      } else if (executionData.conversation_data) {
        conversationTranscript = executionData.conversation_data;
      } else if (executionData.call_data?.messages) {
        conversationTranscript = executionData.call_data.messages;
      } else if (executionData.messages) {
        conversationTranscript = executionData.messages;
      }

      // Parse messages if conversation is an array or object with messages
      if (Array.isArray(conversationTranscript)) {
        conversationMessages = conversationTranscript.map((msg, idx) => ({
          role: msg.role || msg.sender || (msg.type === 'agent_message' ? 'agent' : 'user'),
          message: msg.message || msg.text || msg.content || '',
          timestamp: msg.timestamp || new Date(Date.now() + idx * 1000),
        }));
      } else if (conversationTranscript && typeof conversationTranscript === 'object') {
        // Handle object format
        if (conversationTranscript.messages && Array.isArray(conversationTranscript.messages)) {
          conversationMessages = conversationTranscript.messages.map((msg, idx) => ({
            role: msg.role || msg.sender || (msg.type === 'agent_message' ? 'agent' : 'user'),
            message: msg.message || msg.text || msg.content || '',
            timestamp: msg.timestamp || new Date(Date.now() + idx * 1000),
          }));
        }
      }

      console.log(`💬 Extracted conversation: ${conversationTranscript ? 'Found' : 'Not found'}, Messages: ${conversationMessages.length}`);

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
        conversationTranscript: conversationTranscript,
        conversationMessages: conversationMessages,
        telephonyData: executionData.telephony_data || null,
        contextDetails: executionData.context_details || null,
        fullData: executionData
      };

      console.log('✅ [extractCallDetailsFromExecution] Extraction completed');
      return extracted;
    } catch (error) {
      console.error('❌ [extractCallDetailsFromExecution] Error:', error.message);
      return null;
    }
  }
}

module.exports = new BolnaApiService();
