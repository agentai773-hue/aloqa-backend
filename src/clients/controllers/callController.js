// clients/controllers/callController.js
const CallService = require('../services/callService');

class CallController {
  constructor() {
    this.callService = new CallService();
  }

  /**
   * Initiate a call to a lead by lead ID
   * POST /client-call/initiate
   */
  async initiateCall(req, res) {
    try {
      const { leadId } = req.body;
      const userId = req.user._id;

      // Validate input
      if (!leadId) {
        return res.status(400).json({
          success: false,
          message: 'Lead ID is required'
        });
      }

      // Call the service
      const result = await this.callService.initiateCall(userId, leadId);

      return res.status(result.statusCode || 500).json(result);
    } catch (error) {
      console.error('Error in callController.initiateCall:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
        statusCode: 500
      });
    }
  }

  /**
   * Initiate a call with custom data
   * POST /client-call/initiate-custom
   */
  async initiateCustomCall(req, res) {
    try {
      const { customerName, projectName, recipientPhoneNumber, assistantId } = req.body;
      const userId = req.user._id;

      // Validate input
      if (!customerName || !projectName || !recipientPhoneNumber || !assistantId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: customerName, projectName, recipientPhoneNumber, assistantId'
        });
      }

      const callData = {
        customerName,
        projectName,
        recipientPhoneNumber,
        assistantId
      };

      // Call the service
      const result = await this.callService.initiateCustomCall(userId, callData);

      return res.status(result.statusCode || 500).json(result);
    } catch (error) {
      console.error('Error in callController.initiateCustomCall:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
        statusCode: 500
      });
    }
  }
}

module.exports = CallController;
