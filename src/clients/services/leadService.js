const leadRepository = require('../repositories/leadRepository');
const singleCallLeadService = require('../callService/singleCallLead');

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
      
      // Handle both populated and non-populated user_id
      const leadUserId = typeof lead.user_id === 'object' 
        ? lead.user_id._id?.toString() 
        : lead.user_id?.toString();
      
      // Verify lead belongs to client
      if (leadUserId !== clientId) {
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
  // Validate client ID
  _validateClientId(clientId) {
    if (!clientId) {
      throw new Error('Client ID is required');
    }
  }

  // Check for duplicate phone number within same project
  async _checkDuplicatePhone(clientId, phone, project) {
    if (phone && phone.trim() !== '' && project && project.trim() !== '') {
      const phoneProjectPairs = [{
        phone: phone.trim(),
        project: project.trim()
      }];
      const existingLeads = await leadRepository.findByPhoneNumbersAndProject(clientId, phoneProjectPairs);
      if (existingLeads.length > 0) {
        throw new Error(`A lead with phone number ${phone} already exists in project "${project}"`);
      }
    }
  }

  // Prepare lead data for creation
  _prepareLead(leadData, clientId) {
    return {
      ...leadData,
      user_id: clientId
    };
  }

  // Create single lead
  async createLead(clientId, leadData) {
    try {
      // Validate inputs
      this._validateClientId(clientId);
      
      // Check for duplicates
      await this._checkDuplicatePhone(
        clientId, 
        leadData.contact_number, 
        leadData.project_name
      );

      // Prepare and create lead FIRST
      const newLeadData = this._prepareLead(leadData, clientId);
      const lead = await leadRepository.create(newLeadData);
      

      
      // NOW make call automatically after successful database save
      if (leadData.contact_number && leadData.project_name) {
        
        // Prepare frontend format for call service
        const frontendLeadData = {
          leadName: leadData.full_name || '',
          fullName: leadData.full_name || '',
          phone: leadData.contact_number || '',
          interestedProject: leadData.project_name || '',
          leadType: leadData.lead_type || 'cold',
          location: '',
          email: '',
          notes: ''
        };
        
        // Process call in background - don't block response
        singleCallLeadService.processLeadCall(clientId, frontendLeadData)
          .then(callResult => {
            if (callResult.success) {
              console.log('✅ Automatic call initiated successfully for lead:', frontendLeadData.leadName);
            } else {
              console.error('❌ Failed to initiate automatic call:', {
                lead_name: frontendLeadData.leadName,
                error_message: callResult.message,
                error_details: callResult.error
              });
            }
          })
          .catch(error => {
            console.error('❌ Error in automatic call process:', {
              lead_name: frontendLeadData.leadName,
              error_message: error.message,
              stack: error.stack
            });
          });
      } else {
        console.log('⚠️ Skipping call - missing phone number or project after database save');
      }
      
      return {
        success: true,
        message: 'Lead created successfully',
        data: lead
      };
    } catch (error) {
      throw new Error(error.message);
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

      // Check for existing phone numbers in database within same projects
      const phoneProjectPairs = leadsData
        .filter(lead => lead.contact_number && lead.contact_number.trim() !== '')
        .map(lead => ({
          phone: lead.contact_number,
          project: lead.project_name || 'no-project'
        }));

      let existingLeads = [];
      if (phoneProjectPairs.length > 0) {
        existingLeads = await leadRepository.findByPhoneNumbersAndProject(clientId, phoneProjectPairs);
      }

      // Create a set of existing phone-project combinations
      const existingPhoneProjectSet = new Set(
        existingLeads.map(lead => `${lead.project_name || 'no-project'}_${lead.contact_number}`)
      );

      // Filter out leads with phone-project combinations that already exist in database
      const skippedLeads = []; // Track skipped leads with details
      const filteredLeadsData = leadsData.filter(lead => {
        const phone = lead.contact_number;
        const project = lead.project_name || 'no-project';
        const leadName = lead.full_name || 'Unknown';
        
        if (!phone || phone.trim() === '') {
          return true; // Keep leads without phone numbers
        }
        
        const phoneProjectKey = `${project}_${phone}`;
        const isDuplicate = existingPhoneProjectSet.has(phoneProjectKey);
        
        if (isDuplicate) {
          console.log(`⚠️ Database duplicate found - Phone: ${phone} in Project: ${project}`);
          skippedLeads.push({
            name: leadName,
            phone: phone,
            project: project,
            reason: 'Phone number already exists in this project in database'
          });
        }
        
        return !isDuplicate;
      });

      // Prepare all leads with userId
      const newLeadsData = filteredLeadsData.map(lead => ({
        ...lead,
        user_id: clientId
      }));

      const leads = await leadRepository.createBulk(newLeadsData);
      
      const duplicatesRemoved = leadsData.length - filteredLeadsData.length;
      let message = `${leads.length} leads created successfully`;
      if (duplicatesRemoved > 0) {
        message += `. ${duplicatesRemoved} duplicate phone numbers within same projects were skipped.`;
      }
      
      return {
        success: true,
        message: message,
        data: {
          created: leads.length,
          skipped: duplicatesRemoved,
          leads: leads
        },
        validation: {
          totalProcessed: leadsData.length,
          created: leads.length,
          skippedCount: duplicatesRemoved,
          skippedLeads: skippedLeads.length > 0 ? skippedLeads : undefined,
          summary: {
            successful: leads.length,
            duplicatesInDatabase: duplicatesRemoved,
            details: skippedLeads.length > 0 ? 
              `${duplicatesRemoved} leads were skipped because they already exist in database with same phone numbers in same projects` 
              : 'No duplicates found'
          }
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
      
      // Handle both populated and non-populated user_id
      const leadUserId = typeof existingLead.user_id === 'object' 
        ? existingLead.user_id._id?.toString() 
        : existingLead.user_id?.toString();
        
      if (leadUserId !== clientId) {
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
      if (!leadId) {
        throw new Error('Lead ID and Client ID are required');
      }


      // First verify lead belongs to client
      const existingLead = await leadRepository.getById(leadId);
      
      // Handle both populated and non-populated user_id
      const leadUserId = typeof existingLead.user_id === 'object' 
        ? existingLead.user_id._id?.toString() 
        : existingLead.user_id?.toString();
        
      console.log('🔍 Delete Lead Debug - Found Lead user_id:', leadUserId);
      console.log('🔍 Delete Lead Debug - Comparison:', {
        leadUserId: leadUserId,
        clientId: clientId,
        match: leadUserId === clientId
      });

      if (leadUserId !== clientId) {
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