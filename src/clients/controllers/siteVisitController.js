const siteVisitService = require('../services/siteVisitService');

class SiteVisitController {
  async createSiteVisit(req, res) {
    try {
      console.log('📍 Creating site visit...');
      const result = await siteVisitService.createSiteVisit(req.body);
      res.status(201).json(result);
    } catch (error) {
      console.error('❌ Error creating site visit:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getSiteVisitById(req, res) {
    try {
      const { id } = req.params;
      const result = await siteVisitService.getSiteVisitById(id);
      res.status(200).json(result);
    } catch (error) {
      console.error('❌ Error fetching site visit:', error);
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getSiteVisitsByLeadId(req, res) {
    try {
      const { leadId } = req.params;
      const result = await siteVisitService.getSiteVisitsByLeadId(leadId);
      res.status(200).json(result);
    } catch (error) {
      console.error('❌ Error fetching site visits:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateSiteVisit(req, res) {
    try {
      const { id } = req.params;
      const result = await siteVisitService.updateSiteVisit(id, req.body);
      res.status(200).json(result);
    } catch (error) {
      console.error('❌ Error updating site visit:', error);
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  async deleteSiteVisit(req, res) {
    try {
      const { id } = req.params;
      const result = await siteVisitService.deleteSiteVisit(id);
      res.status(200).json(result);
    } catch (error) {
      console.error('❌ Error deleting site visit:', error);
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getUpcomingSiteVisits(req, res) {
    try {
      const { leadId } = req.params;
      const result = await siteVisitService.getUpcomingSiteVisits(leadId);
      res.status(200).json(result);
    } catch (error) {
      console.error('❌ Error fetching upcoming site visits:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getCompletedSiteVisits(req, res) {
    try {
      const { leadId } = req.params;
      const result = await siteVisitService.getCompletedSiteVisits(leadId);
      res.status(200).json(result);
    } catch (error) {
      console.error('❌ Error fetching completed site visits:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async extractSiteVisitFromTranscript(req, res) {
    try {
      const { leadId, callHistoryId, transcript } = req.body;

      if (!leadId || !callHistoryId || !transcript) {
        return res.status(400).json({
          success: false,
          message: 'leadId, callHistoryId, and transcript are required',
        });
      }

      const result = await siteVisitService.extractAndCreateSiteVisit(
        leadId,
        callHistoryId,
        transcript
      );
      res.status(result.success ? 201 : 200).json(result);
    } catch (error) {
      console.error('❌ Error extracting site visit:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new SiteVisitController();

