const Lead = require('../../models/Lead');

class LeadRepository {
  async create(leadData) {
    try {
      const lead = new Lead(leadData);
      await lead.save();
      return lead;
    } catch (error) {
      throw new Error(`Error creating lead: ${error.message}`);
    }
  }

  async findAll(userId) {
    try {
      const leads = await Lead.find({ 
        user_id: userId,
        deleted_at: null 
      }).sort({ created_at: -1 });
      return leads;
    } catch (error) {
      throw new Error(`Error fetching leads: ${error.message}`);
    }
  }

  async findById(id, userId) {
    try {
      const lead = await Lead.findOne({ 
        _id: id,
        user_id: userId,
        deleted_at: null 
      });
      return lead;
    } catch (error) {
      throw new Error(`Error finding lead: ${error.message}`);
    }
  }

  async update(id, leadData, userId) {
    try {
      // Use findByIdAndUpdate to avoid full document validation
      // This allows partial updates without triggering required field validation
      const updatedLead = await Lead.findByIdAndUpdate(
        id,
        { $set: leadData },
        { 
          new: true,
          runValidators: false // Skip Mongoose validation to allow partial updates
        }
      );
      
      if (!updatedLead) {
        return null;
      }

      // Verify user ownership
      if (updatedLead.user_id.toString() !== userId.toString()) {
        return null;
      }

      return updatedLead;
    } catch (error) {
      throw new Error(`Error updating lead: ${error.message}`);
    }
  }

  async delete(id, userId) {
    try {
      const lead = await Lead.findOne({ 
        _id: id,
        user_id: userId,
        deleted_at: null 
      });
      if (!lead) {
        return null;
      }
      lead.deleted_at = new Date();
      await lead.save();
      return lead;
    } catch (error) {
      throw new Error(`Error deleting lead: ${error.message}`);
    }
  }

  async findByContactNumber(contactNumber, userId) {
    try {
      const lead = await Lead.findOne({ 
        contact_number: contactNumber,
        user_id: userId,
        deleted_at: null 
      });
      return lead;
    } catch (error) {
      throw new Error(`Error finding lead by contact number: ${error.message}`);
    }
  }

  async findByContactNumbers(contactNumbers, userId) {
    try {
      const leads = await Lead.find({ 
        contact_number: { $in: contactNumbers },
        user_id: userId,
        deleted_at: null 
      });
      return leads;
    } catch (error) {
      throw new Error(`Error finding leads by contact numbers: ${error.message}`);
    }
  }

  async createBulk(leadsData) {
    try {
      const leads = await Lead.insertMany(leadsData);
      return leads;
    } catch (error) {
      throw new Error(`Error bulk creating leads: ${error.message}`);
    }
  }

  // Search leads with filters: searchTerm, lead_type, call_status, date_range
  async searchLeads(userId, searchTerm = '', page = 1, pageSize = 10, filters = {}) {
    try {
      const skip = (page - 1) * pageSize;

      // Start with base query - only non-deleted leads
      let query = { 
        user_id: userId,
        deleted_at: null 
      };

      // Add search term filter if provided (search across name, contact_number, project_name)
      if (searchTerm && searchTerm.trim()) {
        const searchRegex = new RegExp(searchTerm, 'i');
        query.$or = [
          { full_name: searchRegex },
          { contact_number: searchRegex },
          { project_name: searchRegex }
        ];
      }

      // Add lead_type filter if provided
      if (filters.leadType && filters.leadType !== 'all') {
        query.lead_type = filters.leadType;
      }

      // Add call_status filter if provided
      if (filters.callStatus && filters.callStatus !== 'all') {
        query.call_status = filters.callStatus;
      }

      // Add date_range filter if provided
      if (filters.dateRange && filters.dateRange !== 'all') {
        const now = new Date();
        let startDate;

        switch (filters.dateRange) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'yesterday':
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
            const endYesterday = new Date(startDate);
            endYesterday.setDate(endYesterday.getDate() + 1);
            query.created_at = { $gte: startDate, $lt: endYesterday };
            break;
          case 'last_week':
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 7);
            break;
          case 'last_month':
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 30);
            break;
          default:
            break;
        }

        // Only add date filter if not yesterday (which has special logic)
        if (filters.dateRange !== 'yesterday' && startDate) {
          query.created_at = { $gte: startDate };
        }
      }


      // Execute query
      const leads = await Lead.find(query)
        .sort({ created_at: -1 })
        .limit(pageSize)
        .skip(skip);

      const total = await Lead.countDocuments(query);


      return {
        leads,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    } catch (error) {
      throw new Error(`Error searching leads: ${error.message}`);
    }
  }
}

module.exports = LeadRepository;
