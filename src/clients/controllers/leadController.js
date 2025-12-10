const leadService = require('../services/leadService');
const projectRepository = require('../repositories/projectRepository');
const { validationResult } = require('express-validator');

// Transform backend lead to frontend format
const transformLeadToFrontend = (lead) => {
  return {
    _id: lead._id,
    leadName: lead.full_name || '',
    fullName: lead.full_name || '',
    phone: lead.contact_number || '',
    email: '', // Not stored in backend model
    location: '', // Not stored in backend model
    interestedProject: lead.project_name || '',
    leadType: lead.lead_type === 'pending' ? 'cold' : lead.lead_type,
    notes: '', // Not stored in backend model
    projectId: lead.project_name || '',
    // Call-related fields
    call_status: lead.call_status || 'pending',
    call_attempt_count: lead.call_attempt_count || 0,
    max_retry_attempts: lead.max_retry_attempts || 3,
    call_disposition: lead.call_disposition,
    last_call_attempt_time: lead.last_call_attempt_time,
    next_scheduled_call_time: lead.next_scheduled_call_time,
    // Removed userId since frontend no longer needs it
    createdAt: lead.created_at,
    updatedAt: lead.updated_at
  };
};

// Transform frontend lead to backend format
const transformLeadToBackend = (lead, clientId) => {
  return {
    full_name: lead.fullName || lead.leadName,
    contact_number: lead.phone,
    project_name: lead.interestedProject,
    lead_type: lead.leadType || 'pending',
    call_status: lead.call_status || 'pending',
    call_attempt_count: lead.call_attempt_count || 0,
    max_retry_attempts: lead.max_retry_attempts || 3,
    call_disposition: lead.call_disposition,
    last_call_attempt_time: lead.last_call_attempt_time,
    next_scheduled_call_time: lead.next_scheduled_call_time,
    user_id: clientId // Always use clientId from token, never from frontend
  };
};

// Validate if project exists for the user
const validateProjectName = async (projectName, clientId) => {
  if (!projectName) return true; // Allow empty project name
  
  try {
    // Check if project exists in user's projects
    const projects = await projectRepository.getAllByClientId(clientId);
    const projectExists = projects.projects.some(project => 
      project.projectName.toLowerCase() === projectName.toLowerCase()
    );
    
    return projectExists;
  } catch (error) {
    console.error('Project validation error:', error);
    return false;
  }
};

const leadController = {
  // Create single lead
  async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const clientId = req.user?.id;
      if (!clientId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      const leadData = transformLeadToBackend(req.body, clientId);
      
      // Validate project name if provided
      if (leadData.project_name) {
        const isValidProject = await validateProjectName(leadData.project_name, clientId);
        if (!isValidProject) {
          return res.status(400).json({
            success: false,
            message: `Project '${leadData.project_name}' does not exist. Please create the project first or leave project name empty.`
          });
        }
      }
      
      const result = await leadService.createLead(clientId, leadData);
      
      // Transform the response data
      const transformedLead = transformLeadToFrontend(result.data);

      res.status(201).json({
        ...result,
        data: transformedLead
      });
    } catch (error) {
      console.error('Create lead error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create lead',
        error: error.message
      });
    }
  },

  // Create multiple leads
  async createBulk(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const clientId = req.user?.id;
      if (!clientId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      const { leads } = req.body;
      
      // Remove duplicates based on phone number within same project only - keep first occurrence
      const seenProjectPhones = new Set(); // Store "project_phone" combinations
      const uniqueLeads = [];
      const removedLeads = [];
      
      for (const lead of leads) {
        const phone = lead.phone || lead.contact_number;
        const projectName = lead.interestedProject || lead.project_name || 'no-project';
        
        if (!phone) {
          // Keep leads without phone numbers
          uniqueLeads.push(lead);
        } else {
          // Create unique key for project-phone combination
          const projectPhoneKey = `${projectName}_${phone.replace(/[^0-9]/g, '')}`;
          
          if (!seenProjectPhones.has(projectPhoneKey)) {
            // First occurrence of this phone number in this project
            seenProjectPhones.add(projectPhoneKey);
            uniqueLeads.push(lead);
          } else {
            // Duplicate within same project - track for logging
            removedLeads.push({
              phone: phone,
              project: projectName,
              reason: `Duplicate phone number within project "${projectName}"`
            });
          }
        }
      }
      
      // Log removed duplicates
      if (removedLeads.length > 0) {
        console.log(`⚠️ Removed ${removedLeads.length} duplicate leads within same projects:`);
        removedLeads.forEach((removed, index) => {
          console.log(`  ${index + 1}. Phone: ${removed.phone} - Project: ${removed.project}`);
        });
      }
      
      const leadsData = uniqueLeads.map(lead => transformLeadToBackend(lead, clientId));
      
      // Validate all project names if provided
      for (const leadData of leadsData) {
        if (leadData.project_name) {
          const isValidProject = await validateProjectName(leadData.project_name, clientId);
          if (!isValidProject) {
            return res.status(400).json({
              success: false,
              message: `Project '${leadData.project_name}' does not exist. Please create the project first or remove project names from leads.`,
              invalidProject: leadData.project_name
            });
          }
        }
      }
      
      const result = await leadService.createBulkLeads(clientId, leadsData);
      
      // Transform the response data
      const transformedLeads = result.data.leads.map(transformLeadToFrontend);

      res.status(201).json({
        ...result,
        data: {
          ...result.data,
          leads: transformedLeads
        },
        validation: {
          // Combine CSV and database validation info
          totalUploaded: leads.length,
          csvDuplicatesRemoved: removedLeads.length,
          csvDuplicateDetails: removedLeads.length > 0 ? removedLeads : undefined,
          
          // Database validation info from service
          totalProcessedForDatabase: uniqueLeads.length,
          databaseDuplicatesSkipped: result.validation?.skippedCount || 0,
          databaseDuplicateDetails: result.validation?.skippedLeads || undefined,
          
          // Overall summary
          summary: {
            totalUploaded: leads.length,
            csvDuplicatesRemoved: removedLeads.length,
            sentToDatabase: uniqueLeads.length,
            successfullySaved: result.data.created,
            databaseDuplicatesSkipped: result.validation?.skippedCount || 0,
            finalMessage: `${result.data.created} leads saved successfully. ${removedLeads.length} CSV duplicates and ${result.validation?.skippedCount || 0} database duplicates were skipped.`
          }
        }
      });
    } catch (error) {
      console.error('Bulk create leads error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create leads',
        error: error.message
      });
    }
  },

  // Get all leads
  async getAll(req, res) {
    try {
      const clientId = req.user?.id;
      
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        search: req.query.search,
        leadType: req.query.leadType
      };

      const result = await leadService.getAllLeads(clientId, filters);
      
      // Transform the response data
      const transformedLeads = result.data.leads.map(transformLeadToFrontend);

      res.status(200).json({
        ...result,
        data: {
          ...result.data,
          leads: transformedLeads
        }
      });
    } catch (error) {
      console.error('Get leads error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch leads'
      });
    }
  },

  // Get lead by ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const clientId = req.user?.id;
      
      const result = await leadService.getLead(id, clientId);
      
      // Transform the response data
      const transformedLead = transformLeadToFrontend(result.data);

      res.status(200).json({
        ...result,
        data: transformedLead
      });
    } catch (error) {
      console.error('Get lead by ID error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch lead'
      });
    }
  },

  // Update lead
  async update(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const clientId = req.user?.id;
      const updateData = transformLeadToBackend(req.body, clientId);
      
      const result = await leadService.updateLead(id, clientId, updateData);
      
      // Transform the response data
      const transformedLead = transformLeadToFrontend(result.data);

      res.status(200).json({
        ...result,
        data: transformedLead
      });
    } catch (error) {
      console.error('Update lead error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update lead'
      });
    }
  },

  // Delete lead
  async delete(req, res) {
    try {
      console.log('🎯 Lead Controller Delete - Called');
      console.log('📋 Params:', req.params);
      console.log('👤 User:', req.user?.id);
      
      const { id } = req.params;
      const clientId = req.user?.id;
      
      const result = await leadService.deleteLead(id,clientId);

      res.status(200).json(result);
    } catch (error) {
      console.error('Delete lead error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete lead'
      });
    }
  },

  // Get lead statistics
  async getStats(req, res) {
    try {
      const clientId = req.user?.id;
      
      const result = await leadService.getLeadStats(clientId);

      res.status(200).json(result);
    } catch (error) {
      console.error('Get lead stats error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch lead statistics'
      });
    }
  }
};

module.exports = leadController;