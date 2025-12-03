/**
 * Lead Type Auto-Update Controller
 * Provides endpoints to trigger lead type updates manually
 */

const leadTypeAutoUpdateService = require('../services/leadTypeAutoUpdateService');
const SiteVisit = require('../../models/SiteVisit');

class LeadTypeAutoUpdateController {
  /**
   * Trigger daily lead type update manually
   * PUT /api/leads/auto-update/trigger
   */
  async triggerDailyUpdate(req, res) {
    try {
      const result = await leadTypeAutoUpdateService.dailyLeadTypeUpdate();
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Confirm site visit and update lead to hot
   * PUT /api/leads/site-visit/confirm/:siteVisitId
   */
  async confirmSiteVisit(req, res) {
    try {
      const { siteVisitId } = req.params;

      // Update site visit status to completed
      const siteVisit = await SiteVisit.findByIdAndUpdate(
        siteVisitId,
        { $set: { status: 'completed' } },
        { new: true }
      ).populate('leadId');

      if (!siteVisit) {
        return res.status(404).json({
          success: false,
          error: 'Site visit not found',
        });
      }

      // Update lead to hot
      if (siteVisit.leadId) {
        const result = await leadTypeAutoUpdateService.updateHotOnSiteVisitConfirmed(
          siteVisit.leadId._id
        );

        if (result.success) {
          return res.status(200).json({
            success: true,
            message: 'Site visit confirmed and lead updated to hot',
            siteVisit: siteVisit,
            lead: result.lead,
          });
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Site visit confirmed',
        siteVisit: siteVisit,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get auto-update stats
   * GET /api/leads/auto-update/stats
   */
  async getStats(req, res) {
    try {
      // This can be extended to return statistics about auto-updated leads
      return res.status(200).json({
        success: true,
        message: 'Auto-update service is running',
        schedule: {
          dailyUpdate: '2:00 AM daily',
          autoCallReset: 'Midnight daily',
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = LeadTypeAutoUpdateController;
