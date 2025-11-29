const siteUserRepository = require('../repositories/siteUserRepository');
const {
  validateCreateSiteUser,
  validateUpdateSiteUser,
} = require('../validators/siteUserValidation');

class SiteUserService {
  // Create site user
  async createSiteUser(clientId, userData) {
    try {
      // Validate input
      const validation = validateCreateSiteUser(userData);
      if (!validation.isValid) {
        const error = new Error('Validation failed');
        error.status = 400;
        error.errors = validation.errors;
        throw error;
      }

      // Check if email already exists for this client
      const emailExists = await siteUserRepository.emailExists(
        userData.email,
        clientId
      );
      if (emailExists) {
        const error = new Error('Email already exists for this client');
        error.status = 400;
        throw error;
      }

      // Create site user
      const siteUser = await siteUserRepository.create({
        ...userData,
        client_id: clientId,
      });

      return {
        success: true,
        data: siteUser,
        message: 'Site user created successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  // Get all site users
  async getAllSiteUsers(clientId, filters = {}) {
    try {
      const siteUsers = await siteUserRepository.getAll(clientId, filters);

      return {
        success: true,
        data: siteUsers,
        count: siteUsers.length,
      };
    } catch (error) {
      throw error;
    }
  }

  // Get single site user
  async getSiteUserById(id, clientId) {
    try {
      const siteUser = await siteUserRepository.getById(id, clientId);

      if (!siteUser) {
        const error = new Error('Site user not found');
        error.status = 404;
        throw error;
      }

      return {
        success: true,
        data: siteUser,
      };
    } catch (error) {
      throw error;
    }
  }

  // Update site user
  async updateSiteUser(id, clientId, updateData) {
    try {
      // Validate input
      const validation = validateUpdateSiteUser(updateData);
      if (!validation.isValid) {
        const error = new Error('Validation failed');
        error.status = 400;
        error.errors = validation.errors;
        throw error;
      }

      // Check if site user exists
      const siteUser = await siteUserRepository.getById(id, clientId);
      if (!siteUser) {
        const error = new Error('Site user not found');
        error.status = 404;
        throw error;
      }

      // Check if email is being updated and if it already exists
      if (updateData.email && updateData.email !== siteUser.email) {
        const emailExists = await siteUserRepository.emailExists(
          updateData.email,
          clientId,
          id
        );
        if (emailExists) {
          const error = new Error('Email already exists for this client');
          error.status = 400;
          throw error;
        }
      }

      // Update site user
      const updatedSiteUser = await siteUserRepository.update(
        id,
        clientId,
        updateData
      );

      return {
        success: true,
        data: updatedSiteUser,
        message: 'Site user updated successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  // Delete site user
  async deleteSiteUser(id, clientId) {
    try {
      // Check if site user exists
      const siteUser = await siteUserRepository.getById(id, clientId);
      if (!siteUser) {
        const error = new Error('Site user not found');
        error.status = 404;
        throw error;
      }

      // Delete site user
      await siteUserRepository.delete(id, clientId);

      return {
        success: true,
        message: 'Site user deleted successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  // Deactivate site user
  async deactivateSiteUser(id, clientId) {
    try {
      // Check if site user exists
      const siteUser = await siteUserRepository.getById(id, clientId);
      if (!siteUser) {
        const error = new Error('Site user not found');
        error.status = 404;
        throw error;
      }

      // Deactivate site user
      const updatedSiteUser = await siteUserRepository.deactivate(
        id,
        clientId
      );

      return {
        success: true,
        data: updatedSiteUser,
        message: 'Site user deactivated successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  // Activate site user
  async activateSiteUser(id, clientId) {
    try {
      // Check if site user exists
      const siteUser = await siteUserRepository.getById(id, clientId);
      if (!siteUser) {
        const error = new Error('Site user not found');
        error.status = 404;
        throw error;
      }

      // Activate site user
      const updatedSiteUser = await siteUserRepository.activate(
        id,
        clientId
      );

      return {
        success: true,
        data: updatedSiteUser,
        message: 'Site user activated successfully',
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new SiteUserService();
