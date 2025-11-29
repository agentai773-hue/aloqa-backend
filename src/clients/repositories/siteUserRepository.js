const SiteUser = require('../../../src/models/SiteUser');

class SiteUserRepository {
  // Create a new site user
  async create(userData) {
    try {
      const siteUser = new SiteUser(userData);
      await siteUser.save();
      return siteUser.toObject();
    } catch (error) {
      throw error;
    }
  }

  // Get all site users for a client
  async getAll(clientId, filters = {}) {
    try {
      const query = { client_id: clientId };

      if (filters.is_active !== undefined) {
        query.is_active = filters.is_active;
      }

      const siteUsers = await SiteUser.find(query)
        .select('-password')
        .sort({ createdAt: -1 });

      return siteUsers;
    } catch (error) {
      throw error;
    }
  }

  // Get a single site user by ID
  async getById(id, clientId) {
    try {
      const siteUser = await SiteUser.findOne({
        _id: id,
        client_id: clientId,
      }).select('-password');

      return siteUser;
    } catch (error) {
      throw error;
    }
  }

  // Get site user by email
  async getByEmail(email, clientId) {
    try {
      const siteUser = await SiteUser.findOne({
        email: email.toLowerCase(),
        client_id: clientId,
      }).select('-password');

      return siteUser;
    } catch (error) {
      throw error;
    }
  }

  // Update site user
  async update(id, clientId, updateData) {
    try {
      const siteUser = await SiteUser.findOneAndUpdate(
        { _id: id, client_id: clientId },
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      return siteUser;
    } catch (error) {
      throw error;
    }
  }

  // Delete site user
  async delete(id, clientId) {
    try {
      const siteUser = await SiteUser.findOneAndDelete({
        _id: id,
        client_id: clientId,
      });

      return siteUser;
    } catch (error) {
      throw error;
    }
  }

  // Check if email exists for a client
  async emailExists(email, clientId, excludeId = null) {
    try {
      const query = {
        email: email.toLowerCase(),
        client_id: clientId,
      };

      if (excludeId) {
        query._id = { $ne: excludeId };
      }

      const count = await SiteUser.countDocuments(query);
      return count > 0;
    } catch (error) {
      throw error;
    }
  }

  // Deactivate site user
  async deactivate(id, clientId) {
    try {
      const siteUser = await SiteUser.findOneAndUpdate(
        { _id: id, client_id: clientId },
        { is_active: false },
        { new: true }
      ).select('-password');

      return siteUser;
    } catch (error) {
      throw error;
    }
  }

  // Activate site user
  async activate(id, clientId) {
    try {
      const siteUser = await SiteUser.findOneAndUpdate(
        { _id: id, client_id: clientId },
        { is_active: true },
        { new: true }
      ).select('-password');

      return siteUser;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new SiteUserRepository();
