const autoCallService = require('../services/autoCallService');

class AutoCallController {
  /**
   * Start auto-call service
   */
  async startAutoCallService(req, res) {
    try {
      const result = autoCallService.startAutoCall();
      res.json(result);
    } catch (error) {
      console.error('Error starting auto-call:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Stop auto-call service
   */
  async stopAutoCallService(req, res) {
    try {
      const result = autoCallService.stopAutoCall();
      res.json(result);
    } catch (error) {
      console.error('Error stopping auto-call:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get auto-call service status
   */
  async getAutoCallServiceStatus(req, res) {
    try {
      const status = autoCallService.getStatus();
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Error getting status:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new AutoCallController();
