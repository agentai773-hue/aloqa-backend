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
      const lead = await Lead.findOne({ 
        _id: id,
        user_id: userId,
        deleted_at: null 
      });
      if (!lead) {
        return null;
      }
      Object.assign(lead, leadData);
      await lead.save();
      return lead;
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
}

module.exports = LeadRepository;
