const LeadRepository = require('../repositories/leadRepository');

class LeadService {
  constructor() {
    this.leadRepository = new LeadRepository();
  }

  async checkLeadExists(contactNumber, userId) {
    try {
      const lead = await this.leadRepository.findByContactNumber(contactNumber, userId);
      if (lead) {
        return {
          success: true,
          exists: true,
          data: lead,
          message: 'Lead already exists',
        };
      }
      return {
        success: true,
        exists: false,
        message: 'Lead does not exist',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async createLead(leadData, userId) {
    try {
      if (!leadData.full_name || !leadData.contact_number || !leadData.lead_type) {
        throw new Error('Missing required fields: full_name, contact_number, lead_type');
      }

      // Check if lead with same contact number already exists for this user
      const existingLead = await this.leadRepository.findByContactNumber(leadData.contact_number, userId);
      if (existingLead) {
        return {
          success: false,
          error: `Lead with contact number ${leadData.contact_number} already exists`,
        };
      }

      // Add userId to lead data
      const leadWithUserId = { ...leadData, user_id: userId };
      const lead = await this.leadRepository.create(leadWithUserId);
      return {
        success: true,
        data: lead,
        message: 'Lead created successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getAllLeads(userId) {
    try {
      const leads = await this.leadRepository.findAll(userId);
      return {
        success: true,
        data: leads,
        message: 'Leads fetched successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getLeadById(id, userId) {
    try {
      const lead = await this.leadRepository.findById(id, userId);
      if (!lead) {
        return {
          success: false,
          error: 'Lead not found',
        };
      }
      return {
        success: true,
        data: lead,
        message: 'Lead fetched successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async updateLead(id, leadData, userId) {
    try {
      const lead = await this.leadRepository.findById(id, userId);
      if (!lead) {
        return {
          success: false,
          error: 'Lead not found',
        };
      }

      // If contact_number is being updated, check if new number already exists for this user
      if (leadData.contact_number && leadData.contact_number !== lead.contact_number) {
        const existingLead = await this.leadRepository.findByContactNumber(leadData.contact_number, userId);
        if (existingLead) {
          return {
            success: false,
            error: `Lead with contact number ${leadData.contact_number} already exists`,
          };
        }
      }

      const updatedLead = await this.leadRepository.update(id, leadData, userId);
      if (!updatedLead) {
        return {
          success: false,
          error: 'Failed to update lead',
        };
      }
      return {
        success: true,
        data: updatedLead,
        message: 'Lead updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async deleteLead(id, userId) {
    try {
      const lead = await this.leadRepository.delete(id, userId);
      if (!lead) {
        return {
          success: false,
          error: 'Lead not found',
        };
      }
      return {
        success: true,
        data: lead,
        message: 'Lead deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async importLeadsFromCSV(leadsData, userId) {
    try {
      if (!Array.isArray(leadsData) || leadsData.length === 0) {
        throw new Error('Invalid CSV data');
      }

      // Validate and prepare data, but skip rows with missing required fields
      const seenNumbers = new Set();
      const validLeads = [];
      const duplicatesInCSV = [];
      const invalidRows = [];

      for (const row of leadsData) {
        const full_name = row.full_name;
        const contact_number = row.contact_number;
        const lead_type = row.lead_type;

        if (!full_name || !contact_number || !lead_type) {
          invalidRows.push({ row, reason: 'Missing required fields' });
          continue;
        }

        if (seenNumbers.has(contact_number)) {
          duplicatesInCSV.push(contact_number);
          continue;
        }

        seenNumbers.add(contact_number);
        validLeads.push({
          full_name,
          contact_number,
          lead_type,
          call_status: row.call_status || 'pending',
          project_name: row.project_name || null,
          user_id: userId,
        });
      }

      // If nothing valid to create, return informative response
      if (validLeads.length === 0) {
        return {
          success: true,
          data: [],
          message: 'No valid leads to import',
          meta: {
            skippedDuplicatesInCSV: [...new Set(duplicatesInCSV)],
            invalidRows,
          },
        };
      }

      // Check for existing leads in database for this user and skip them
      const contactNumbers = validLeads.map((l) => l.contact_number);
      const existingLeads = await this.leadRepository.findByContactNumbers(contactNumbers, userId);
      const existingPhones = existingLeads.map((lead) => lead.contact_number);

      const toCreate = validLeads.filter((l) => !existingPhones.includes(l.contact_number));
      const skippedExisting = validLeads.filter((l) => existingPhones.includes(l.contact_number)).map(l => l.contact_number);

      let createdLeads = [];
      if (toCreate.length > 0) {
        createdLeads = await this.leadRepository.createBulk(toCreate);
      }

      return {
        success: true,
        data: createdLeads,
        message: `${createdLeads.length} leads imported successfully`,
        meta: {
          skippedDuplicatesInCSV: [...new Set(duplicatesInCSV)],
          skippedExistingInDB: [...new Set(skippedExisting)],
          invalidRows,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = LeadService;
