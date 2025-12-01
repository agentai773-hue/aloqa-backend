const Lead = require('../../models/Lead');
const SiteVisit = require('../../models/SiteVisit');
const mongoose = require('mongoose');

class LeadDashboardRepository {
  /**
   * Get aggregated leads dashboard statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Leads dashboard statistics
   */
  async getLeadsDashboardStats(userId) {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);

      // Get total leads count
      const totalLeads = await Lead.countDocuments({
        user_id: userObjectId,
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

      // Get all leads with their details
      const leadsList = await Lead.find({
        user_id: userObjectId,
        deleted_at: null,
      })
        .select('_id full_name contact_number lead_type call_status project_name created_at updated_at')
        .sort({ created_at: -1 })
        .lean();

      // Get site visits count
      const totalSiteVisits = await SiteVisit.countDocuments({
        userId: userObjectId,
      });

      // Get site visits breakdown (if needed for analytics)
      const siteVisitsByStatus = await SiteVisit.aggregate([
        {
          $match: {
            userId: userObjectId,
          },
        },
        {
          $group: {
            _id: '$visitStatus',
            count: { $sum: 1 },
          },
        },
      ]);

      // Calculate conversion metrics
      const convertedLeads = leadsList.filter(
        (lead) => lead.lead_type === 'connected' || lead.call_status === 'completed'
      ).length;

      const pendingLeads = leadsList.filter(
        (lead) => lead.lead_type === 'pending' || lead.call_status === 'pending'
      ).length;

      const hotLeads = leadsList.filter((lead) => lead.lead_type === 'hot').length;
      const coldLeads = leadsList.filter((lead) => lead.lead_type === 'cold').length;
      const fakeLeads = leadsList.filter((lead) => lead.lead_type === 'fake').length;
      const connectedLeads = leadsList.filter((lead) => lead.lead_type === 'connected').length;

      // Get recent leads (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentLeads = await Lead.countDocuments({
        user_id: userObjectId,
        deleted_at: null,
        created_at: { $gte: sevenDaysAgo },
      });

      // Calculate conversion rate
      const conversionRate =
        totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(2) : 0;

      return {
        summary: {
          totalLeads,
          convertedLeads,
          pendingLeads,
          conversionRate: parseFloat(conversionRate),
          recentLeads,
          totalSiteVisits,
        },
        breakdown: {
          byType: {
            hot: hotLeads,
            cold: coldLeads,
            pending: pendingLeads,
            connected: connectedLeads,
            fake: fakeLeads,
          },
          byCallStatus: leadsByCallStatus.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          siteVisits: siteVisitsByStatus.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
        },
        leads: leadsList,
      };
    } catch (error) {
      throw new Error(`Error fetching leads dashboard stats: ${error.message}`);
    }
  }

  /**
   * Get leads statistics with filters
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Filtered leads statistics
   */
  async getLeadsWithFilters(userId, filters = {}) {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);

      const matchStage = {
        user_id: userObjectId,
        deleted_at: null,
      };

      // Apply lead type filter
      if (filters.leadType && filters.leadType !== 'all') {
        matchStage.lead_type = filters.leadType;
      }

      // Apply call status filter
      if (filters.callStatus && filters.callStatus !== 'all') {
        matchStage.call_status = filters.callStatus;
      }

      // Apply date range filter
      if (filters.dateRange && filters.dateRange !== 'all') {
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

      const leads = await Lead.find(matchStage)
        .select('_id full_name contact_number lead_type call_status project_name created_at updated_at')
        .sort({ created_at: -1 })
        .lean();

      return {
        total: leads.length,
        leads,
      };
    } catch (error) {
      throw new Error(`Error fetching filtered leads: ${error.message}`);
    }
  }
}

module.exports = LeadDashboardRepository;
