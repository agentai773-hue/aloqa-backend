const BolnaAI = require('./bolna.ai');
const Assistant = require('../../models/Assistant');

/**
 * Call Service for managing voice AI calls through Bolna.ai
 */
class CallService {
  constructor() {
    this.bolnaClient = new BolnaAI();
  }


  async makeSampleCall(callData) {
    try {
      console.log('🎯 CallService: Making sample call with data:', callData);
      
      const { phoneNumber, recipientName, assistantId, fromPhoneNumber } = callData;

      // 1. Validate and fetch assistant details
      const assistant = await this._getAssistantById(assistantId);
      
      // 2. Validate assistant has Bolna integration
      if (!assistant.agentId) {
        throw new Error('Assistant is not configured with Bolna.ai integration. Bolna agent ID missing.');
      }

      // 3. Format phone numbers to E.164 format
      const formattedRecipientPhone = this.bolnaClient.formatPhoneNumber(phoneNumber);
      const formattedFromPhone = fromPhoneNumber 
        ? this.bolnaClient.formatPhoneNumber(fromPhoneNumber)
        : process.env.DEFAULT_FROM_PHONE_NUMBER || '+918035735888';

      // 4. Prepare call data for Bolna.ai API
      const bolnaCallData = {
        agent_id: assistant.agentId,
        recipient_phone_number: formattedRecipientPhone,
        from_phone_number: formattedFromPhone,
        user_data: {
          customer_name: recipientName,
          assistant_name: assistant.agentName,
          call_initiated_at: new Date().toISOString(),
          // Add any additional user variables from assistant configuration
          ...(assistant.userVariables || {})
        }
      };

      console.log('📋 CallService: Prepared Bolna call data:', {
        agent_id: bolnaCallData.agent_id,
        recipient_phone_number: bolnaCallData.recipient_phone_number,
        from_phone_number: bolnaCallData.from_phone_number,
        user_data: bolnaCallData.user_data
      });

      // 5. Make the call through Bolna.ai
      const bolnaResponse = await this.bolnaClient.makeCall(bolnaCallData);

      // 6. Format and return successful response
      const result = {
        success: true,
        message: 'Call initiated successfully',
        data: {
          execution_id: bolnaResponse.execution_id,
          status: bolnaResponse.status,
          bolna_message: bolnaResponse.message,
          assistant: {
            id: assistant._id,
            name: assistant.agentName,
            bolna_agent_id: assistant.agentId
          },
          call_details: {
            recipient_phone: formattedRecipientPhone,
            from_phone: formattedFromPhone,
            recipient_name: recipientName,
            initiated_at: new Date().toISOString()
          }
        }
      };

      console.log('✅ CallService: Call initiated successfully:', {
        execution_id: result.data.execution_id,
        status: result.data.status
      });

      return result;

    } catch (error) {
      console.error('❌ CallService makeSampleCall error:', error);
      
      // Re-throw with enhanced error context
      if (error.message.includes('Assistant not found')) {
        throw new Error('Assistant not found with the provided ID');
      }
      
      if (error.message.includes('Bolna agent ID')) {
        throw error; // Pass through as-is
      }
      
      if (error.message.includes('Bolna.ai API Error')) {
        throw error; // Pass through Bolna API errors as-is
      }
      
      if (error.message.includes('Invalid phone number')) {
        throw new Error(`Invalid phone number format: ${error.message}`);
      }

      throw new Error(`Failed to make sample call: ${error.message}`);
    }
  }

  /**
   * Get assistant by ID and validate existence
   * @param {string} assistantId - MongoDB ObjectId
   * @returns {Object} Assistant document
   * @private
   */
  async _getAssistantById(assistantId) {
    try {
      const assistant = await Assistant.findById(assistantId);
      
      if (!assistant) {
        throw new Error('Assistant not found with the provided ID');
      }

      console.log('📋 CallService: Found assistant:', {
        id: assistant._id,
        name: assistant.agentName,
        agentId: assistant.agentId || 'Not configured'
      });

      return assistant;
    } catch (error) {
      if (error.message.includes('Assistant not found')) {
        throw error;
      }
      throw new Error('Failed to fetch assistant details');
    }
  }

  /**
   * Get call status from Bolna.ai (for future implementation)
   * @param {string} executionId - Bolna execution/call ID
   * @returns {Object} Call status
   */
  async getCallStatus(executionId) {
    try {
      // TODO: Implement call status checking when Bolna.ai provides the endpoint
      console.log('🔍 CallService: Getting call status for execution ID:', executionId);
      
      return {
        success: true,
        message: 'Call status feature coming soon',
        data: {
          execution_id: executionId,
          status: 'unknown',
          note: 'Call status tracking will be implemented when Bolna.ai provides the endpoint'
        }
      };
    } catch (error) {
      console.error('❌ CallService getCallStatus error:', error);
      throw new Error(`Failed to get call status: ${error.message}`);
    }
  }
}

module.exports = CallService;