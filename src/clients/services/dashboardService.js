const DashboardRepository = require('../repositories/dashboardRepository');

class DashboardService {
  constructor() {
    this.dashboardRepository = new DashboardRepository();
  }

  /**
   * Get complete dashboard statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Complete dashboard stats
   */
  async getDashboardStats(userId) {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'User ID is required',
        };
      }

      const stats = await this.dashboardRepository.getDashboardStats(userId);

      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get call history statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Call history stats
   */
  async getCallHistoryStats(userId) {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'User ID is required',
        };
      }

      const stats = await this.dashboardRepository.getDashboardStats(userId);

      return {
        success: true,
        data: stats.callHistory,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error in getCallHistoryStats:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get leads statistics
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Leads stats
   */
  async getLeadsStats(userId, filters = {}) {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'User ID is required',
        };
      }

      const stats = await this.dashboardRepository.getLeadStats(userId, filters);

      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error in getLeadsStats:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get assistant statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Assistant stats
   */
  async getAssistantsStats(userId) {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'User ID is required',
        };
      }

      const stats = await this.dashboardRepository.getDashboardStats(userId);

      return {
        success: true,
        data: stats.assistants,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error in getAssistantsStats:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get specific assistant call statistics
   * @param {string} userId - User ID
   * @param {string} assistantId - Assistant ID
   * @returns {Promise<Object>} Assistant call stats
   */
  async getAssistantCallStats(userId, assistantId) {
    try {
      if (!userId || !assistantId) {
        return {
          success: false,
          error: 'User ID and Assistant ID are required',
        };
      }

      const stats = await this.dashboardRepository.getAssistantCallStats(
        userId,
        assistantId
      );

      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error in getAssistantCallStats:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = DashboardService;
