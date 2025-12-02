const DashboardService = require('../services/dashboardService');

class DashboardController {
  constructor() {
    this.dashboardService = new DashboardService();
  }

  /**
   * Get complete dashboard statistics
   * GET /api/client-dashboard/stats
   */
  async getDashboardStats(req, res) {
    try {
      const userId = req.user._id;

      const result = await this.dashboardService.getDashboardStats(userId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get call history statistics only
   * GET /api/client-dashboard/call-history-stats
   */
  async getCallHistoryStats(req, res) {
    try {
      const userId = req.user._id;

      const result = await this.dashboardService.getCallHistoryStats(userId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in getCallHistoryStats:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get leads statistics with optional filters
   * POST /api/client-dashboard/leads-stats
   * Body: { dateRange?: 'today' | 'week' | 'month' | '3months', leadType?: string, callStatus?: string }
   */
  async getLeadsStats(req, res) {
    try {
      const userId = req.user._id;
      const filters = req.body || {};

      const result = await this.dashboardService.getLeadsStats(userId, filters);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in getLeadsStats:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get assistants statistics
   * GET /api/client-dashboard/assistants-stats
   */
  async getAssistantsStats(req, res) {
    try {
      const userId = req.user._id;

      const result = await this.dashboardService.getAssistantsStats(userId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in getAssistantsStats:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get specific assistant call statistics
   * GET /api/client-dashboard/assistant-call-stats/:assistantId
   */
  async getAssistantCallStats(req, res) {
    try {
      const userId = req.user._id;
      const { assistantId } = req.params;

      if (!assistantId) {
        return res.status(400).json({
          success: false,
          error: 'Assistant ID is required',
        });
      }

      const result = await this.dashboardService.getAssistantCallStats(
        userId,
        assistantId
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in getAssistantCallStats:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = DashboardController;
