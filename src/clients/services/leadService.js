const leadRepository = require('../repositories/leadRepository');

class LeadService {
  // Get all leads for a client with filtering
  async getAllLeads(clientId, filters = {}) {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      // Update the filters to use userId terminology  
      const updatedFilters = {
        ...filters,
        userId: clientId
      };

      const result = await leadRepository.getAll(updatedFilters);
      
      return {
        success: true,
        message: 'Leads fetched successfully',
        data: {
          leads: result.leads,
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      };
    } catch (error) {
      throw new Error(`Service error: ${error.message}`);
    }
  }

  // Get single lead
  async getLead(leadId, clientId) {
    try {
      if (!leadId || !clientId) {
        throw new Error('Lead ID and Client ID are required');
      }

      const lead = await leadRepository.getById(leadId);
      
      // Verify lead belongs to client
      if (lead.user_id?.toString() !== clientId) {
        throw new Error('Lead not found or access denied');
      }
      
      return {
        success: true,
        message: 'Lead fetched successfully',
        data: lead
      };
    } catch (error) {
      throw new Error(`Service error: ${error.message}`);
    }
  }

  // Create new lead
  async createLead(clientId, leadData) {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      // Prepare lead data with userId
      const newLeadData = {
        ...leadData,
        user_id: clientId
      };

      const lead = await leadRepository.create(newLeadData);
      
      return {
        success: true,
        message: 'Lead created successfully',
        data: lead
      };
    } catch (error) {
      throw new Error(`Service error: ${error.message}`);
    }
  }

  // Create multiple leads
  async createBulkLeads(clientId, leadsData) {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      if (!Array.isArray(leadsData) || leadsData.length === 0) {
        throw new Error('Leads array is required and must not be empty');
      }

      // Prepare all leads with userId
      const newLeadsData = leadsData.map(lead => ({
        ...lead,
        user_id: clientId
      }));

      const leads = await leadRepository.createBulk(newLeadsData);
      
      return {
        success: true,
        message: `${leads.length} leads created successfully`,
        data: {
          created: leads.length,
          leads: leads
        }
      };
    } catch (error) {
      throw new Error(`Service error: ${error.message}`);
    }
  }

  // Update lead
  async updateLead(leadId, clientId, updateData) {
    try {
      if (!leadId || !clientId) {
        throw new Error('Lead ID and Client ID are required');
      }

      // First verify lead belongs to client
      const existingLead = await leadRepository.getById(leadId);
      if (existingLead.user_id?.toString() !== clientId) {
        throw new Error('Lead not found or access denied');
      }

      // Remove userId from update data if present (shouldn't be changed)
      const { userId: _, ...safeUpdateData } = updateData;

      const lead = await leadRepository.update(leadId, safeUpdateData);
      
      return {
        success: true,
        message: 'Lead updated successfully',
        data: lead
      };
    } catch (error) {
      throw new Error(`Service error: ${error.message}`);
    }
  }

  // Delete lead
  async deleteLead(leadId, clientId) {
    try {
      if (!leadId || !clientId) {
        throw new Error('Lead ID and Client ID are required');
      }

      // First verify lead belongs to client
      const existingLead = await leadRepository.getById(leadId);
      if (existingLead.user_id?.toString() !== clientId) {
        throw new Error('Lead not found or access denied');
      }

      const result = await leadRepository.delete(leadId);
      
      return {
        success: true,
        message: result.message
      };
    } catch (error) {
      throw new Error(`Service error: ${error.message}`);
    }
  }

  // Get lead statistics
  async getLeadStats(clientId) {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      const stats = await leadRepository.getStats(clientId);
      
      return {
        success: true,
        message: 'Lead statistics fetched successfully',
        data: stats
      };
    } catch (error) {
      throw new Error(`Service error: ${error.message}`);
    }
  }
}

module.exports = new LeadService();