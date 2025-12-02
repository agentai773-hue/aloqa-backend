// clients/services/callService.js
const axios = require('axios');
const CallRepository = require('../repositories/callRepository');
const callHistoryService = require('./callHistoryService');
const bolnaApiService = require('../../utils/bolnaApi');

class CallService {
  constructor() {
    this.repository = new CallRepository();
  }

  /**
   * Initiate a call to a lead
   */
  async initiateCall(params) {
    try {
      // Support both old signature (userId, leadId) and new signature ({userId, leadId, isAutoCall})
      const userId = typeof params === 'string' ? params : params.userId;
      const leadId = typeof params === 'string' ? arguments[1] : params.leadId;
      const isAutoCall = typeof params === 'object' ? params.isAutoCall : false;
      const autoCallAttemptNumber = typeof params === 'object' ? params.autoCallAttemptNumber : 0;


      // 1. Get lead details
      const lead = await this.repository.getLeadByIdAndUser(leadId, userId);
      
      if (!lead) {
        console.error(`❌ Lead not found: leadId=${leadId}, userId=${userId}`);
        return {
          success: false,
          statusCode: 404,
          message: 'Lead not found'
        };
      }


      // 2. Check if lead has a project assigned
      if (!lead.project_name) {
        return {
          success: false,
          statusCode: 400,
          message: 'Lead does not have a project assigned. Please assign a project to this lead first.'
        };
      }

      // 3. Get assignment for this lead's project
      const assignment = await this.repository.getAssignmentForCall(
        userId,
        lead.project_name
      );

      if (!assignment) {
        return {
          success: false,
          statusCode: 404,
          message: `No assignment found for project "${lead.project_name}". Please assign an assistant and phone to this project first.`
        };
      }

      // 4. Extract agent_id from assignment
      const agentId = assignment.assistantId?.agentId;
      
      if (!agentId) {
        return {
          success: false,
          statusCode: 400,
          message: 'Agent ID not found. Please ensure the assistant is properly configured.'
        };
      }

      // 5. Get phone number - could be MongoDB ID or phone string
      let fromPhoneNumber;
      
      // Check if phoneId is a MongoDB ID
      const isMongoId = /^[0-9a-fA-F]{24}$/.test(assignment.phoneId);
      
      if (isMongoId) {
        // Fetch actual phone number from database
        const phoneRecord = await this.repository.getPhoneNumberById(assignment.phoneId);
        fromPhoneNumber = phoneRecord?.phoneNumber;
      } else if (typeof assignment.phoneId === 'string') {
        // It's already a phone number string (default case)
        fromPhoneNumber = assignment.phoneId;
      } else if (assignment.phoneId?.phoneNumber) {
        // It's an object with phoneNumber property
        fromPhoneNumber = assignment.phoneId.phoneNumber;
      }

      if (!fromPhoneNumber) {
        return {
          success: false,
          statusCode: 400,
          message: 'Phone number not found. Please ensure a phone is assigned to the project.'
        };
      }

      // 6. Prepare Bolna API payload
      // Ensure phone numbers have country code
      let recipientPhoneNumber = lead.contact_number;
      if (!recipientPhoneNumber.startsWith('+')) {
        recipientPhoneNumber = `+91${recipientPhoneNumber}`;
      }

      let fromPhone = fromPhoneNumber;
      if (!fromPhone.startsWith('+')) {
        fromPhone = `+91${fromPhone}`;
      }

      const bolnaPayload = {
        agent_id: agentId,
        recipient_phone_number: recipientPhoneNumber,
        from_phone_number: fromPhone,
        scheduled_at: null,
        user_data: {
          customer_name: lead.full_name,
          project_name: lead.project_name,
          lead_id: lead._id.toString(),
          lead_type: lead.lead_type,
          call_status: lead.call_status
        }
      };

      // 7. Get user's Bolna API bearer token
      const bearerToken = await this.repository.getUserBearerToken(userId);
      
      if (!bearerToken) {
        return {
          success: false,
          statusCode: 400,
          message: 'Bolna API bearer token not configured. Please configure your API key in account settings.'
        };
      }

      // 8. Make call to Bolna API
      const bolnaResponse = await this.makeCallToBolnaAPI(bolnaPayload, bearerToken);

      if (!bolnaResponse.success) {
        return {
          success: false,
          statusCode: 400,
          message: bolnaResponse.error || 'Failed to initiate call',
          details: bolnaResponse.details
        };
      }

      // 9. Save call history
      try {
        const historyData = {
          userId,
          leadId,
          agentId,
          phoneNumberId: isMongoId ? assignment.phoneId : null,
          recipientPhoneNumber,
          callerName: lead.full_name,
          assistantId: assignment.assistantId._id,
          callId: bolnaResponse.callId,
          executionId: bolnaResponse.executionId,
          runId: bolnaResponse.runId,
          webhookUrl: assignment.assistantId?.webhookUrl || null,
          projectName: lead.project_name,
          status: bolnaResponse.status,
          bolnaResponse: bolnaResponse.initialResponse || {},
          executionDetails: bolnaResponse.executionDetails || null,
          isAutoCall: isAutoCall,
          autoCallAttemptNumber: autoCallAttemptNumber,
        };

        // If we have callDetails from execution, use them to fill in missing data
        if (bolnaResponse.callDetails) {
          if (!historyData.callId && bolnaResponse.callDetails.callId) {
            historyData.callId = bolnaResponse.callDetails.callId;
          }
          if (!historyData.phoneNumberId && bolnaResponse.callDetails.phoneNumberId) {
            historyData.phoneNumberId = bolnaResponse.callDetails.phoneNumberId;
          }
        }


        await callHistoryService.saveCallHistory(historyData);
      } catch (historyError) {
        console.error('Failed to save call history:', historyError);
        // Don't return error, call was initiated successfully
      }

      return {
        success: true,
        statusCode: 200,
        message: 'Call initiated successfully',
        data: {
          execution_id: bolnaResponse.executionId,
          call_id: bolnaResponse.callId || null,
          status: bolnaResponse.status,
          lead_name: lead.full_name,
          phone_number: lead.contact_number
        }
      };
    } catch (error) {
      console.error('Error in initiateCall:', error);
      return {
        success: false,
        statusCode: 500,
        message: error.message || 'Failed to initiate call'
      };
    }
  }

  /**
   * Make actual API call to Bolna
   */
  async makeCallToBolnaAPI(payload, bearerToken) {
    try {
      // Step 1: Make initial call to Bolna
      const initialResponse = await bolnaApiService.makeCallToBolna(payload, bearerToken);

      if (!initialResponse.success) {
        return {
          success: false,
          error: initialResponse.error || 'Failed to initiate call',
          details: initialResponse.details
        };
      }

      // Step 2: Fetch execution details using the execution_id
      // This may take a moment, so add small delay
      let executionDetails = null;
      let executionAttempts = 0;
      const maxAttempts = 3;

      while (executionAttempts < maxAttempts && !executionDetails) {
        // Wait before fetching (first attempt immediate, then wait)
        if (executionAttempts > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        }

        const executionResponse = await bolnaApiService.fetchExecutionDetails(
          initialResponse.executionId,
          bearerToken
        );

        if (executionResponse.success && executionResponse.data) {
          executionDetails = executionResponse.data;
          break;
        }

        executionAttempts++;
      }

      // Step 3: Extract call details from execution
      const callDetails = executionDetails 
        ? bolnaApiService.extractCallDetailsFromExecution(executionDetails)
        : null;

      // Step 4: Return combined response
      return {
        success: true,
        executionId: initialResponse.executionId,
        runId: initialResponse.runId,
        callId: callDetails?.callId || null,
        status: initialResponse.status,
        executionDetails: executionDetails,
        callDetails: callDetails,
        initialResponse: initialResponse.initialResponse
      };
    } catch (error) {
      console.error('Error in makeCallToBolnaAPI:', error);
      return {
        success: false,
        error: error.message || 'Failed to make call to Bolna API'
      };
    }
  }

  /**
   * Initiate a call with custom data (not from lead, but from form input)
   * Used for Make Call form where user provides data directly
   */
  async initiateCustomCall(userId, callData) {
    try {
      const { customerName, projectName, recipientPhoneNumber, assistantId } = callData;

      // Validate required fields
      if (!customerName || !projectName || !recipientPhoneNumber || !assistantId) {
        return {
          success: false,
          statusCode: 400,
          message: 'Missing required fields: customerName, projectName, recipientPhoneNumber, assistantId'
        };
      }

      // Get assistant details to extract agentId
      const assistant = await this.repository.getAssistantById(assistantId);
      
      if (!assistant) {
        return {
          success: false,
          statusCode: 404,
          message: 'Assistant not found'
        };
      }

      const agentId = assistant.agentId;
      
      if (!agentId) {
        return {
          success: false,
          statusCode: 400,
          message: 'Agent ID not found for this assistant'
        };
      }

      // Get assignment to get the from_phone_number
      const assignment = await this.repository.getAssignmentForCall(
        userId,
        projectName
      );

      if (!assignment) {
        return {
          success: false,
          statusCode: 404,
          message: `No assignment found for project "${projectName}". Please assign an assistant and phone to this project first.`
        };
      }

      // Get phone number
      let fromPhoneNumber;
      
      const isMongoId = /^[0-9a-fA-F]{24}$/.test(assignment.phoneId);
      
      if (isMongoId) {
        const phoneRecord = await this.repository.getPhoneNumberById(assignment.phoneId);
        fromPhoneNumber = phoneRecord?.phoneNumber;
      } else if (typeof assignment.phoneId === 'string') {
        fromPhoneNumber = assignment.phoneId;
      } else if (assignment.phoneId?.phoneNumber) {
        fromPhoneNumber = assignment.phoneId.phoneNumber;
      }

      if (!fromPhoneNumber) {
        return {
          success: false,
          statusCode: 400,
          message: 'Phone number not found. Please ensure a phone is assigned to the project.'
        };
      }

      // Ensure phone numbers have country code
      let finalRecipientPhone = recipientPhoneNumber;
      if (!finalRecipientPhone.startsWith('+')) {
        finalRecipientPhone = `+91${finalRecipientPhone}`;
      }

      let fromPhone = fromPhoneNumber;
      if (!fromPhone.startsWith('+')) {
        fromPhone = `+91${fromPhone}`;
      }

      const bolnaPayload = {
        agent_id: agentId,
        recipient_phone_number: finalRecipientPhone,
        from_phone_number: fromPhone,
        scheduled_at: null,
        user_data: {
          customer_name: customerName,
          project_name: projectName
        }
      };

      // Get user's Bolna API bearer token
      const bearerToken = await this.repository.getUserBearerToken(userId);
      
      if (!bearerToken) {
        return {
          success: false,
          statusCode: 400,
          message: 'Bolna API bearer token not configured. Please configure your API key in account settings.'
        };
      }

      // Make call to Bolna API
      const bolnaResponse = await this.makeCallToBolnaAPI(bolnaPayload, bearerToken);

      if (!bolnaResponse.success) {
        return {
          success: false,
          statusCode: 400,
          message: bolnaResponse.error || 'Failed to initiate call',
          details: bolnaResponse.details
        };
      }

      // Save call history
      try {
        const historyData = {
          userId,
          leadId: null,
          agentId,
          phoneNumberId: isMongoId ? assignment.phoneId : null,
          recipientPhoneNumber: finalRecipientPhone,
          callerName: customerName,
          assistantId: assistantId,
          callId: bolnaResponse.callId,
          executionId: bolnaResponse.executionId,
          runId: bolnaResponse.runId,
          webhookUrl: assistant?.webhookUrl || null,
          projectName,
          status: bolnaResponse.status,
          bolnaResponse: bolnaResponse.initialResponse || {},
          executionDetails: bolnaResponse.executionDetails || null,
        };

        // If we have callDetails from execution, use them to fill in missing data
        if (bolnaResponse.callDetails) {
          if (!historyData.callId && bolnaResponse.callDetails.callId) {
            historyData.callId = bolnaResponse.callDetails.callId;
          }
          if (!historyData.phoneNumberId && bolnaResponse.callDetails.phoneNumberId) {
            historyData.phoneNumberId = bolnaResponse.callDetails.phoneNumberId;
          }
        }


        await callHistoryService.saveCallHistory(historyData);
      } catch (historyError) {
        console.error('Failed to save call history:', historyError);
        // Don't return error, call was initiated successfully
      }

      return {
        success: true,
        statusCode: 200,
        message: 'Call initiated successfully',
        data: {
          execution_id: bolnaResponse.executionId,
          call_id: bolnaResponse.callId || null,
          status: bolnaResponse.status,
          customer_name: customerName,
          phone_number: recipientPhoneNumber
        }
      };
    } catch (error) {
      console.error('Error in initiateCustomCall:', error);
      return {
        success: false,
        statusCode: 500,
        message: error.message || 'Failed to initiate call'
      };
    }
  }
}

module.exports = CallService;
