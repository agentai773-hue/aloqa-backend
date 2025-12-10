const CallService = require('../services/callService');

// Initialize call service
const callService = new CallService();

const callController = {
  // Make a sample call
  makeSampleCall: async (req, res) => {
    try {
      console.log('📞 CallController: Received makeSampleCall request:', req.body);
      
      const data = req.body;

      // Validate required fields are present
      if (!data.phoneNumber || !data.recipientName || !data.assistantId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: phoneNumber, recipientName, and assistantId are required',
          error: {
            type: 'VALIDATION_ERROR',
            fields: {
              phoneNumber: !data.phoneNumber ? 'Phone number is required' : null,
              recipientName: !data.recipientName ? 'Recipient name is required' : null,
              assistantId: !data.assistantId ? 'Assistant ID is required' : null
            }
          }
        });
      }

      // Make the call using CallService and Bolna.ai
      const result = await callService.makeSampleCall(data);

      // Return successful response
      console.log('✅ CallController: Call initiated successfully:', {
        execution_id: result.data.execution_id,
        status: result.data.status
      });

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ CallController: Error making sample call:', {
        message: error.message,
        stack: error.stack
      });
      
      // Enhanced error handling with proper HTTP status codes and formatted responses
      
      // Assistant not found error
      if (error.message.includes('Assistant not found')) {
        return res.status(404).json({
          success: false,
          message: 'Selected assistant not found',
          error: {
            type: 'RESOURCE_NOT_FOUND',
            resource: 'assistant',
            details: error.message
          },
          timestamp: new Date().toISOString()
        });
      }
      
      // Assistant configuration error
      if (error.message.includes('Bolna agent ID') || error.message.includes('not configured with Bolna.ai')) {
        return res.status(400).json({
          success: false,
          message: 'Assistant is not configured with Bolna.ai integration',
          error: {
            type: 'CONFIGURATION_ERROR',
            resource: 'assistant',
            details: 'Assistant requires Bolna agent ID to make calls',
            solution: 'Please configure the assistant with a valid Bolna.ai agent ID'
          },
          timestamp: new Date().toISOString()
        });
      }

      // Phone number validation error
      if (error.message.includes('Invalid phone number')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format',
          error: {
            type: 'VALIDATION_ERROR',
            field: 'phoneNumber',
            details: error.message,
            expected_format: '10 digits for Indian numbers (e.g., 9876543210)'
          },
          timestamp: new Date().toISOString()
        });
      }
      
      // Bolna.ai API specific errors
      if (error.message.includes('Bolna.ai API Error: 401')) {
        return res.status(500).json({
          success: false,
          message: 'Call service authentication failed',
          error: {
            type: 'AUTHENTICATION_ERROR',
            service: 'bolna_ai',
            details: 'Invalid or missing API token',
            action_required: 'Please contact administrator to verify API configuration'
          },
          timestamp: new Date().toISOString()
        });
      }

      if (error.message.includes('Bolna.ai API Error: 400')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request parameters for call service',
          error: {
            type: 'BAD_REQUEST',
            service: 'bolna_ai',
            details: error.message
          },
          timestamp: new Date().toISOString()
        });
      }

      if (error.message.includes('Bolna.ai API Error: 404')) {
        return res.status(404).json({
          success: false,
          message: 'Bolna.ai agent not found',
          error: {
            type: 'RESOURCE_NOT_FOUND',
            service: 'bolna_ai',
            resource: 'agent',
            details: 'The configured Bolna agent ID does not exist',
            solution: 'Please verify the assistant configuration'
          },
          timestamp: new Date().toISOString()
        });
      }

      if (error.message.includes('Bolna.ai API Error: 429')) {
        return res.status(429).json({
          success: false,
          message: 'Rate limit exceeded',
          error: {
            type: 'RATE_LIMIT_ERROR',
            service: 'bolna_ai',
            details: 'Too many call requests. Please wait before trying again.',
            retry_after: '60 seconds'
          },
          timestamp: new Date().toISOString()
        });
      }

      if (error.message.includes('Bolna.ai Network Error')) {
        return res.status(503).json({
          success: false,
          message: 'Call service temporarily unavailable',
          error: {
            type: 'SERVICE_UNAVAILABLE',
            service: 'bolna_ai',
            details: 'Unable to connect to call service',
            action_required: 'Please try again later or contact support'
          },
          timestamp: new Date().toISOString()
        });
      }

      // Generic Bolna.ai API errors
      if (error.message.includes('Bolna.ai API Error')) {
        return res.status(502).json({
          success: false,
          message: 'Call service error',
          error: {
            type: 'EXTERNAL_SERVICE_ERROR',
            service: 'bolna_ai',
            details: error.message
          },
          timestamp: new Date().toISOString()
        });
      }

      // Generic server error
      return res.status(500).json({
        success: false,
        message: 'Internal server error while processing call request',
        error: {
          type: 'INTERNAL_ERROR',
          details: error.message || 'An unexpected error occurred',
          request_id: req.id || 'unknown'
        },
        timestamp: new Date().toISOString()
      });
    }
  }
};

module.exports = callController;