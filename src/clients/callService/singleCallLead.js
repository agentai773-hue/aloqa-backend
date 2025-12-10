const { bolnaAPI, BOLNA_CONFIG } = require('./bolnaConfig');
const projectRepository = require('../repositories/projectRepository');

class SingleCallLeadService {
  
  // Get project data by project name and client ID
  async getProjectData(clientId, projectName) {
    try {
      if (!projectName) {
        throw new Error('Project name is required for making calls');
      }

      const projectData = await projectRepository.getAllByClientId(clientId);
      const project = projectData.projects.find(
        p => p.projectName.toLowerCase() === projectName.toLowerCase()
      );

      if (!project) {
        throw new Error(`Project "${projectName}" not found`);
      }

      // Validate required fields for call
      if (!project.assistantId?.agentId) {
        throw new Error(`No agent assigned to project "${projectName}"`);
      }

      if (!project.phoneNumber) {
        throw new Error(`No phone number assigned to project "${projectName}"`);
      }

      return project;
    } catch (error) {
      console.error('❌ Error getting project data:', error.message);
      throw error;
    }
  }

  // Format phone number to E.164 format
  formatPhoneNumber(phone) {
    if (!phone) return null;
    
    // Remove all non-digit characters
    let cleanPhone = phone.replace(/\D/g, '');
    
    // Add country code if not present (assuming India +91)
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }
    
    // Add + prefix for E.164 format
    return '+' + cleanPhone;
  }

  // Prepare call payload for Bolna.ai API
  prepareCallPayload(leadData, projectData) {
    try {
      const recipientPhone = this.formatPhoneNumber(leadData.phone);
      const fromPhone = this.formatPhoneNumber(projectData.phoneNumber);

      if (!recipientPhone) {
        throw new Error('Valid recipient phone number is required');
      }

      if (!fromPhone) {
        throw new Error('Valid project phone number is required');
      }

      // Prepare call payload according to Bolna.ai API documentation
      const callPayload = {
        agent_id: projectData.assistantId.agentId,
        recipient_phone_number: recipientPhone,
        from_phone_number: fromPhone,
        user_data: {
          // Lead information
          lead_name: leadData.leadName || leadData.fullName || 'Unknown Lead',
          full_name: leadData.fullName || leadData.leadName || 'Unknown Lead', 
          phone_number: leadData.phone,
          project_name: leadData.interestedProject || projectData.projectName,
          lead_type: leadData.leadType || 'cold',
          
          // Optional fields
          location: leadData.location || '',
          email: leadData.email || '',
          notes: leadData.notes || '',
          
          // Project context
          assistant_name: projectData.assistantName || 'AI Assistant',
          project_phone: projectData.phoneNumber
        }
      };

      console.log('📋 Prepared Bolna.ai call payload:', {
        agent_id: callPayload.agent_id,
        recipient_phone_number: callPayload.recipient_phone_number,
        from_phone_number: callPayload.from_phone_number,
        lead_info: {
          name: callPayload.user_data.lead_name,
          project: callPayload.user_data.project_name
        }
      });

      return callPayload;

    } catch (error) {
      console.error('❌ Error preparing call payload:', error.message);
      throw error;
    }
  }

  // Make call to Bolna.ai API (single attempt only)
  async makeCall(callPayload) {
    try {
      console.log('📞 Making call to Bolna.ai...');
      
      const response = await bolnaAPI.post(BOLNA_CONFIG.ENDPOINTS.MAKE_CALL, callPayload);
      
      if (response.data) {
        const { message, status, execution_id } = response.data;
        
        console.log('✅ Call initiated successfully:', {
          message,
          status,
          execution_id,
          recipient: callPayload.recipient_phone_number,
          agent_id: callPayload.agent_id
        });
        
        return {
          success: true,
          message: message || 'Call initiated successfully',
          data: {
            call_id: execution_id,
            call_status: status,
            recipient_phone: callPayload.recipient_phone_number,
            from_phone: callPayload.from_phone_number,
            agent_id: callPayload.agent_id,
            bolna_response: response.data
          }
        };
      } else {
        throw new Error('Invalid response from Bolna.ai API');
      }

    } catch (error) {
      console.error('❌ Call failed:', error.message);
      
      let errorMessage = 'Failed to initiate call';
      let errorDetails = null;
      let errorType = 'UNKNOWN_ERROR';

      if (error.code === 'ECONNABORTED') {
        errorType = 'TIMEOUT';
        errorMessage = 'Call request timed out. Bolna.ai API is taking too long to respond.';
      } else if (error.code === 'ENOTFOUND') {
        errorType = 'NETWORK_ERROR';
        errorMessage = 'Cannot reach Bolna.ai API. Check internet connection.';
      } else if (error.response?.status === 401) {
        errorType = 'UNAUTHORIZED';
        errorMessage = 'Invalid Bolna.ai API token. Check ALOQA_TOKEN in environment.';
      } else if (error.response?.status === 400) {
        errorType = 'BAD_REQUEST';
        errorMessage = error.response.data?.message || 'Invalid request format.';
        errorDetails = error.response.data;
      } else if (error.response?.data) {
        errorMessage = error.response.data.message || error.response.data.error || errorMessage;
        errorDetails = error.response.data;
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.error('❌ Call failure details:', {
        error_type: errorType,
        message: errorMessage,
        details: errorDetails
      });

      return {
        success: false,
        message: errorMessage,
        error: {
          type: errorType,
          details: errorDetails || error.message,
          original_error: error.code || error.response?.status
        }
      };
    }
  }

  // Test API connectivity (single attempt)
  async testConnection() {
    try {
      console.log('🧪 Testing Bolna.ai API connectivity (single attempt)...');
      console.log('🔧 Configuration:', {
        BASE_URL: BOLNA_CONFIG.BASE_URL,
        API_TOKEN: BOLNA_CONFIG.API_TOKEN ? `${BOLNA_CONFIG.API_TOKEN.substring(0, 15)}...` : 'NOT_SET',
        ENDPOINT: BOLNA_CONFIG.ENDPOINTS.MAKE_CALL
      });

      // Test with minimal payload
      const testPayload = {
        agent_id: "test-agent",
        recipient_phone_number: "+919999999999",
        from_phone_number: "+918888888888"
      };

      const startTime = Date.now();
      const response = await bolnaAPI.post(BOLNA_CONFIG.ENDPOINTS.MAKE_CALL, testPayload);
      const responseTime = Date.now() - startTime;

      console.log('✅ API Connection Test Result:', {
        status: 'SUCCESS',
        response_time: responseTime + 'ms',
        response_data: response.data
      });

      return { success: true, responseTime, data: response.data };

    } catch (error) {
      const errorInfo = {
        status: 'FAILED',
        error_code: error.code,
        error_message: error.message,
        response_status: error.response?.status,
        response_data: error.response?.data
      };

      console.log('❌ API Connection Test Failed (single attempt):', errorInfo);
      return { success: false, error: errorInfo };
    }
  }

  // Main function to process lead and make call
  async processLeadCall(clientId, leadData) {
    try {
      console.log('🔄 Processing lead call for:', leadData.leadName || leadData.fullName);

      // Step 1: Get project data
      const projectData = await this.getProjectData(clientId, leadData.interestedProject);
      console.log('📊 Project data retrieved:', {
        projectName: projectData.projectName,
        assistantName: projectData.assistantName,
        phoneNumber: projectData.phoneNumber,
        agentId: projectData.assistantId.agentId
      });

      // Step 2: Prepare call payload
      const callPayload = this.prepareCallPayload(leadData, projectData);

      // Step 3: Make call to Bolna.ai
      const callResult = await this.makeCall(callPayload);

      if (callResult.success) {
        console.log('🎉 Call process completed successfully:', {
          call_id: callResult.data.call_id,
          status: callResult.data.call_status,
          lead: leadData.leadName || leadData.fullName,
          phone: leadData.phone
        });
      }

      return {
        success: callResult.success,
        message: callResult.message,
        data: {
          lead_info: {
            name: leadData.leadName || leadData.fullName,
            phone: leadData.phone,
            project: leadData.interestedProject
          },
          project_info: {
            name: projectData.projectName,
            assistant: projectData.assistantName,
            phone: projectData.phoneNumber,
            agent_id: projectData.assistantId.agentId
          },
          call_result: callResult.data || null
        },
        error: callResult.error
      };

    } catch (error) {
      console.error('❌ Error processing lead call:', error.message);
      
      return {
        success: false,
        message: error.message || 'Failed to process lead call',
        error: error.message
      };
    }
  }
}

module.exports = new SingleCallLeadService();