const LeadService = require('../services/leadService');

class LeadController {
  constructor() {
    this.leadService = new LeadService();
  }

  async checkLeadExists(req, res) {
    try {
      const { contact_number } = req.query;
      const userId = req.user._id;

      if (!contact_number) {
        return res.status(400).json({
          success: false,
          error: 'contact_number is required',
        });
      }

      const result = await this.leadService.checkLeadExists(contact_number, userId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async createLead(req, res) {
    try {
      const { full_name, contact_number, lead_type, call_status, project_name } =
        req.body;
      const userId = req.user._id;

      const result = await this.leadService.createLead({
        full_name,
        contact_number,
        lead_type,
        call_status,
        project_name,
      }, userId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(201).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getAllLeads(req, res) {
    try {
      const userId = req.user._id;

      const result = await this.leadService.getAllLeads(userId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getLeadById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const result = await this.leadService.getLeadById(id, userId);

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async updateLead(req, res) {
    try {
      const { id } = req.params;
      const { full_name, contact_number, lead_type, call_status, project_name } =
        req.body;
      const userId = req.user._id;

      const result = await this.leadService.updateLead(id, {
        full_name,
        contact_number,
        lead_type,
        call_status,
        project_name,
      }, userId);

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async deleteLead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const result = await this.leadService.deleteLead(id, userId);

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async importLeads(req, res) {
    try {
      const { leadsData } = req.body;
      const userId = req.user._id;

      if (!leadsData) {
        return res.status(400).json({
          success: false,
          error: 'leadsData is required',
        });
      }

      const result = await this.leadService.importLeadsFromCSV(leadsData, userId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(201).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Search leads with filters
  async searchLeads(req, res) {
    try {
      const userId = req.user._id;
      const { searchTerm = '', page = 1, pageSize = 10, leadType = 'all', callStatus = 'all', dateRange = 'all' } = req.body;

      // Build filters object
      const filters = {};
      if (leadType && leadType !== 'all') {
        filters.leadType = leadType;
      }
      if (callStatus && callStatus !== 'all') {
        filters.callStatus = callStatus;
      }
      if (dateRange && dateRange !== 'all') {
        filters.dateRange = dateRange;
      }


      const result = await this.leadService.searchLeads(
        userId,
        searchTerm ? searchTerm.trim() : '',
        parseInt(page),
        parseInt(pageSize),
        filters
      );

      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('Error in searchLeads:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = LeadController;
