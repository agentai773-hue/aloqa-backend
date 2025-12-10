const axios = require('axios');

/**
 * Bolna.ai API Client for making voice AI calls
 * Documentation: https://www.bolna.ai/docs/api-reference/calls/make
 */
class BolnaAI {
  constructor() {
    this.baseURL = process.env.BOLNA_API_BASE_URL || 'https://api.bolna.ai';
    this.bearerToken = process.env.ALOQA_TOKEN;
    
    if (!this.bearerToken) {
      console.warn('⚠️ BOLNA_API_KEY or ALOQA_TOKEN not found in environment variables');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.bearerToken}`
      }
    });

    // Add response interceptor for better error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('🚨 Bolna.ai API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            method: error.config?.method,
            url: error.config?.url,
            data: error.config?.data
          }
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Make a voice AI call through Bolna.ai API
   * @param {Object} callData - Call configuration
   * @param {string} callData.agent_id - Bolna agent ID (UUID format)
   * @param {string} callData.recipient_phone_number - Recipient phone in E.164 format
   * @param {string} callData.from_phone_number - Sender phone in E.164 format
   * @param {string} [callData.scheduled_at] - Scheduled time in ISO 8601 format
   * @param {Object} [callData.user_data] - Additional user variables
   * @returns {Object} Bolna API response
   */
  async makeCall(callData) {
    try {
      console.log('📞 BolnaAI: Making call request:', {
        agent_id: callData.agent_id,
        recipient_phone_number: callData.recipient_phone_number,
        from_phone_number: callData.from_phone_number,
        scheduled_at: callData.scheduled_at || 'immediate',
        user_data: callData.user_data || {}
      });

      const response = await this.client.post('/call', callData);
      
      console.log('✅ BolnaAI: Call initiated successfully:', {
        status: response.data.status,
        execution_id: response.data.execution_id,
        message: response.data.message
      });

      return response.data;
    } catch (error) {
      // Enhanced error handling for different scenarios
      if (error.response) {
        // Server responded with error status
        const { status, data } = error.response;
        
        switch (status) {
          case 400:
            throw new Error(`Bolna.ai API Error: Bad Request - ${data.message || 'Invalid request parameters'}`);
          case 401:
            throw new Error(`Bolna.ai API Error: Unauthorized - Invalid or missing API token`);
          case 403:
            throw new Error(`Bolna.ai API Error: Forbidden - Insufficient permissions`);
          case 404:
            throw new Error(`Bolna.ai API Error: Not Found - ${data.message || 'Agent or resource not found'}`);
          case 429:
            throw new Error(`Bolna.ai API Error: Rate Limit Exceeded - Too many requests`);
          case 500:
            throw new Error(`Bolna.ai API Error: Internal Server Error - ${data.message || 'Service temporarily unavailable'}`);
          default:
            throw new Error(`Bolna.ai API Error: ${status} - ${data.message || 'Unknown error occurred'}`);
        }
      } else if (error.request) {
        // Network error
        throw new Error(`Bolna.ai Network Error: Unable to reach API service. Please check internet connection.`);
      } else {
        // Other errors
        throw new Error(`Bolna.ai Request Error: ${error.message}`);
      }
    }
  }

  /**
   * Validate phone number format (E.164)
   * @param {string} phoneNumber - Phone number to validate
   * @returns {boolean} True if valid E.164 format
   */
  isValidE164PhoneNumber(phoneNumber) {
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }

  /**
   * Convert phone number to E.164 format
   * @param {string} phoneNumber - Phone number (10 digits for India)
   * @param {string} countryCode - Country code (default: '+91' for India)
   * @returns {string} Phone number in E.164 format
   */
  formatPhoneNumber(phoneNumber, countryCode = '+91') {
    // Remove any existing + or country code
    const cleanNumber = phoneNumber.replace(/^\+?91/, '').replace(/\D/g, '');
    
    // For Indian numbers, ensure it's 10 digits
    if (cleanNumber.length === 10) {
      return `${countryCode}${cleanNumber}`;
    }
    
    throw new Error(`Invalid phone number format: ${phoneNumber}. Expected 10 digits for Indian numbers.`);
  }
}

module.exports = BolnaAI;