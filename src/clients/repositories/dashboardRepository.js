const Lead = require('../../models/Lead');
const CallHistory = require('../../models/CallHistory');
const Assistant = require('../../models/Assistant');
const mongoose = require('mongoose');

class DashboardRepository {
  /**
   * Get aggregated dashboard statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Dashboard statistics
   */
  async getDashboardStats(userId) {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);

      // Get total leads count
      const totalLeads = await Lead.countDocuments({
        user_id: userId,
        deleted_at: null,
      });

      // Get leads breakdown by type
      const leadsByType = await Lead.aggregate([
        {
          $match: {
            user_id: userObjectId,
            deleted_at: null,
          },
        },
        {
          $group: {
            _id: '$lead_type',
            count: { $sum: 1 },
          },
        },
      ]);

      // Get leads breakdown by call status
      const leadsByCallStatus = await Lead.aggregate([
        {
          $match: {
            user_id: userObjectId,
            deleted_at: null,
          },
        },
        {
          $group: {
            _id: '$call_status',
            count: { $sum: 1 },
          },
        },
      ]);

      // Get total call history count
      const totalCallHistory = await CallHistory.countDocuments({
        userId: userObjectId,
      });

      // Get call history breakdown by status
      const callsByStatus = await CallHistory.aggregate([
        {
          $match: {
            userId: userObjectId,
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);

      // Get total minutes from all calls (callDuration is in seconds)
      const totalMinutesData = await CallHistory.aggregate([
        {
          $match: {
            userId: userObjectId,
          },
        },
        {
          $group: {
            _id: null,
            totalSeconds: { $sum: '$callDuration' },
          },
        },
      ]);

      const totalSeconds = totalMinutesData[0]?.totalSeconds || 0;
      const totalMinutes = Math.floor(totalSeconds / 60);
      const remainingSeconds = totalSeconds % 60;

      // Get assistant count (active assistants for this user)
      const totalAssistants = await Assistant.countDocuments({
        userId: userObjectId,
        status: { $ne: 'deleted' },
      });

      // Get active assistants count
      const activeAssistants = await Assistant.countDocuments({
        userId: userObjectId,
        status: 'active',
      });

      // Get recent call history (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentCalls = await CallHistory.countDocuments({
        userId: userObjectId,
        createdAt: { $gte: sevenDaysAgo },
      });

      // Get successful calls (completed)
      const successfulCalls = await CallHistory.countDocuments({
        userId: userObjectId,
        status: 'completed',
      });

      // Calculate success rate
      const successRate = totalCallHistory > 0 
        ? ((successfulCalls / totalCallHistory) * 100).toFixed(2)
        : 0;

      return {
        leads: {
          total: totalLeads,
          byType: leadsByType.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          byCallStatus: leadsByCallStatus.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
        },
        callHistory: {
          total: totalCallHistory,
          successful: successfulCalls,
          successRate: parseFloat(successRate),
          byStatus: callsByStatus.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          recent: recentCalls, // Last 7 days
        },
        assistants: {
          total: totalAssistants,
          active: activeAssistants,
          inactive: totalAssistants - activeAssistants,
        },
        callDuration: {
          totalSeconds: totalSeconds,
          totalMinutes: totalMinutes,
          remainingSeconds: remainingSeconds,
          formatted: `${totalMinutes}:${String(remainingSeconds).padStart(2, '0')}`,
        },
      };
    } catch (error) {
      throw new Error(`Error fetching dashboard stats: ${error.message}`);
    }
  }

  /**
   * Get call history statistics for a specific assistant
   * @param {string} userId - User ID
   * @param {string} assistantId - Assistant ID
   * @returns {Promise<Object>} Assistant call statistics
   */
  async getAssistantCallStats(userId, assistantId) {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const assistantObjectId = new mongoose.Types.ObjectId(assistantId);

      const totalCalls = await CallHistory.countDocuments({
        userId: userObjectId,
        assistantId: assistantObjectId,
      });

      const successfulCalls = await CallHistory.countDocuments({
        userId: userObjectId,
        assistantId: assistantObjectId,
        status: 'completed',
      });

      const totalMinutesData = await CallHistory.aggregate([
        {
          $match: {
            userId: userObjectId,
            assistantId: assistantObjectId,
          },
        },
        {
          $group: {
            _id: null,
            totalSeconds: { $sum: '$callDuration' },
          },
        },
      ]);

      const totalSeconds = totalMinutesData[0]?.totalSeconds || 0;
      const successRate = totalCalls > 0 
        ? ((successfulCalls / totalCalls) * 100).toFixed(2)
        : 0;

      return {
        assistantId,
        totalCalls,
        successfulCalls,
        successRate: parseFloat(successRate),
        totalSeconds,
        totalMinutes: Math.floor(totalSeconds / 60),
        averageCallDuration: totalCalls > 0 
          ? Math.floor(totalSeconds / totalCalls)
          : 0,
      };
    } catch (error) {
      throw new Error(`Error fetching assistant call stats: ${error.message}`);
    }
  }

  /**
   * Get lead statistics with different filters
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options (dateRange, leadType, callStatus)
   * @returns {Promise<Object>} Lead statistics
   */
  async getLeadStats(userId, filters = {}) {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);

      const matchStage = {
        user_id: userObjectId,
        deleted_at: null,
      };

      // Apply date range filter if provided
      if (filters.dateRange) {
        const now = new Date();
        let startDate;

        switch (filters.dateRange) {
          case 'today':
            startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '3months':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = null;
        }

        if (startDate) {
          matchStage.created_at = { $gte: startDate };
        }
      }

      // Apply lead type filter
      if (filters.leadType && filters.leadType !== 'all') {
        matchStage.lead_type = filters.leadType;
      }

      // Apply call status filter
      if (filters.callStatus && filters.callStatus !== 'all') {
        matchStage.call_status = filters.callStatus;
      }

      const stats = await Lead.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            byType: {
              $push: {
                type: '$lead_type',
                _id: '$_id',
              },
            },
            byStatus: {
              $push: {
                status: '$call_status',
                _id: '$_id',
              },
            },
          },
        },
      ]);

      const result = stats[0] || { total: 0, byType: [], byStatus: [] };

      return {
        total: result.total,
        byType: result.byType.reduce((acc, item) => {
          acc[item.type] = (acc[item.type] || 0) + 1;
          return acc;
        }, {}),
        byStatus: result.byStatus.reduce((acc, item) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        }, {}),
      };
    } catch (error) {
      throw new Error(`Error fetching lead stats: ${error.message}`);
    }
  }
}

module.exports = DashboardRepository;
