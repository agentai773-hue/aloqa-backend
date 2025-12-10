const Lead = require('../../models/Lead');

class LeadRepository {
  // Create a new lead
  async create(leadData) {
    try {
      const lead = new Lead(leadData);
      return await lead.save();
    } catch (error) {
      throw new Error(`Failed to create lead: ${error.message}`);
    }
  }

  // Create multiple leads at once
  async createBulk(leadsData) {
    try {
      return await Lead.insertMany(leadsData, { ordered: false });
    } catch (error) {
      throw new Error(`Failed to create leads: ${error.message}`);
    }
  }

  // Get all leads with pagination and filtering
  async getAll(filters = {}) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        leadType = '',
        userId 
      } = filters;

      // Build query
      const query = { deleted_at: null };

      // Add user filter
      if (userId) {
        query.user_id = userId;
      }

      // Add lead type filter
      if (leadType) {
        query.lead_type = leadType;
      }

      // Add search filter
      if (search) {
        query.$or = [
          { full_name: { $regex: search, $options: 'i' } },
          { contact_number: { $regex: search, $options: 'i' } },
          { project_name: { $regex: search, $options: 'i' } }
        ];
      }

      // Calculate skip
      const skip = (page - 1) * limit;

      // Execute queries
      const [leads, total] = await Promise.all([
        Lead.find(query)
          .populate('user_id', 'email username')
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Lead.countDocuments(query)
      ]);

      return {
        leads,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw new Error(`Failed to get leads: ${error.message}`);
    }
  }

  // Get lead by ID
  async getById(id) {
    try {
      const lead = await Lead.findOne({ _id: id, deleted_at: null })
        .populate('user_id', 'email username');
      
      if (!lead) {
        throw new Error('Lead not found');
      }
      
      return lead;
    } catch (error) {
      throw new Error(`Failed to get lead: ${error.message}`);
    }
  }

  // Update lead
  async update(id, updateData) {
    try {
      const lead = await Lead.findOneAndUpdate(
        { _id: id, deleted_at: null },
        { ...updateData, updated_at: new Date() },
        { new: true, runValidators: true }
      ).populate('user_id', 'email username');

      if (!lead) {
        throw new Error('Lead not found');
      }

      return lead;
    } catch (error) {
      throw new Error(`Failed to update lead: ${error.message}`);
    }
  }

  // Soft delete lead
  async delete(id) {
    try {
      const lead = await Lead.findOneAndUpdate(
        { _id: id, deleted_at: null },
        { deleted_at: new Date() },
        { new: true }
      );

      if (!lead) {
        throw new Error('Lead not found');
      }

      return { message: 'Lead deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete lead: ${error.message}`);
    }
  }

  // Get leads statistics
  async getStats(userId = null) {
    try {
      const matchFilter = { deleted_at: null };
      if (userId) {
        matchFilter.user_id = userId;
      }

      const stats = await Lead.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: '$lead_type',
            count: { $sum: 1 }
          }
        }
      ]);

      const statsObj = {
        total: 0,
        hot: 0,
        cold: 0,
        fake: 0,
        pending: 0,
        connected: 0,
        not_interested: 0
      };

      stats.forEach(stat => {
        if (stat._id && statsObj.hasOwnProperty(stat._id)) {
          statsObj[stat._id] = stat.count;
          statsObj.total += stat.count;
        }
      });

      return statsObj;
    } catch (error) {
      throw new Error(`Failed to get lead statistics: ${error.message}`);
    }
  }

  // Find leads by phone numbers for duplicate checking
  async findByPhoneNumbers(userId, phoneNumbers) {
    try {
      return await Lead.find({
        user_id: userId,
        contact_number: { $in: phoneNumbers },
        deleted_at: null
      }).select('contact_number');
    } catch (error) {
      throw new Error(`Failed to find leads by phone numbers: ${error.message}`);
    }
  }

  // Find leads by phone numbers within specific projects for duplicate checking
  async findByPhoneNumbersAndProject(userId, phoneProjectPairs) {
    try {
      // Build query for phone-project combinations
      const orConditions = phoneProjectPairs.map(pair => ({
        user_id: userId,
        contact_number: pair.phone,
        project_name: pair.project,
        deleted_at: null
      }));

      if (orConditions.length === 0) {
        return [];
      }

      return await Lead.find({
        $or: orConditions
      }).select('contact_number project_name');
    } catch (error) {
      throw new Error(`Failed to find leads by phone numbers and project: ${error.message}`);
    }
  }
}

module.exports = new LeadRepository();