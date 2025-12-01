const LeadDashboardService = require('../services/leadDashboardService');

class LeadDashboardController {
  constructor() {
    this.leadDashboardService = new LeadDashboardService();
  }

  /**
   * Get complete leads dashboard statistics
   * GET /api/leads/dashboard
   */
  async getLeadsDashboardStats(req, res) {
    try {
      const userId = req.user._id;

      const result = await this.leadDashboardService.getLeadsDashboardStats(userId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in getLeadsDashboardStats:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get leads with filters
   * POST /api/leads/dashboard/filtered
   * Body: { leadType?: string, callStatus?: string, dateRange?: string }
   */
  async getLeadsWithFilters(req, res) {
    try {
      const userId = req.user._id;
      const filters = req.body || {};

      const result = await this.leadDashboardService.getLeadsWithFilters(userId, filters);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in getLeadsWithFilters:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = LeadDashboardController;
