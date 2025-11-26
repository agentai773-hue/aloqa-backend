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
}

module.exports = LeadController;
