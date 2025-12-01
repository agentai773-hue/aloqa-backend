const LeadDashboardRepository = require('../repositories/leadDashboardRepository');

class LeadDashboardService {
  constructor() {
    this.leadDashboardRepository = new LeadDashboardRepository();
  }

  /**
   * Get complete leads dashboard statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Complete leads dashboard stats
   */
  async getLeadsDashboardStats(userId) {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'User ID is required',
        };
      }

      const stats = await this.leadDashboardRepository.getLeadsDashboardStats(userId);

      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error in getLeadsDashboardStats:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get leads with filters
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Filtered leads
   */
  async getLeadsWithFilters(userId, filters = {}) {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'User ID is required',
        };
      }

      const result = await this.leadDashboardRepository.getLeadsWithFilters(
        userId,
        filters
      );

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error in getLeadsWithFilters:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = LeadDashboardService;
