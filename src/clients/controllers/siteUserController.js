const siteUserService = require('../services/siteUserService');

class SiteUserController {
  // Create site user
  async createSiteUser(req, res) {
    try {
      const clientId = req.user._id; // From middleware
      const { full_name, email, contact_number, project_name, password } = req.body;

      const result = await siteUserService.createSiteUser(clientId, {
        full_name,
        email,
        contact_number,
        project_name,
        password,
      });

      res.status(201).json(result);
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message,
        ...(error.errors && { errors: error.errors }),
      });
    }
  }

  // Get all site users
  async getAllSiteUsers(req, res) {
    try {
      const clientId = req.user._id;
      const { is_active } = req.query;

      const filters = {};
      if (is_active !== undefined) {
        filters.is_active = is_active === 'true';
      }

      const result = await siteUserService.getAllSiteUsers(clientId, filters);

      res.status(200).json(result);
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get single site user
  async getSiteUserById(req, res) {
    try {
      const { id } = req.params;
      const clientId = req.user._id;

      const result = await siteUserService.getSiteUserById(id, clientId);

      res.status(200).json(result);
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Update site user
  async updateSiteUser(req, res) {
    try {
      const { id } = req.params;
      const clientId = req.user._id;
      const updateData = req.body;

      const result = await siteUserService.updateSiteUser(
        id,
        clientId,
        updateData
      );

      res.status(200).json(result);
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message,
        ...(error.errors && { errors: error.errors }),
      });
    }
  }

  // Delete site user
  async deleteSiteUser(req, res) {
    try {
      const { id } = req.params;
      const clientId = req.user._id;

      const result = await siteUserService.deleteSiteUser(id, clientId);

      res.status(200).json(result);
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Deactivate site user
  async deactivateSiteUser(req, res) {
    try {
      const { id } = req.params;
      const clientId = req.user._id;

      const result = await siteUserService.deactivateSiteUser(id, clientId);

      res.status(200).json(result);
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Activate site user
  async activateSiteUser(req, res) {
    try {
      const { id } = req.params;
      const clientId = req.user._id;

      const result = await siteUserService.activateSiteUser(id, clientId);

      res.status(200).json(result);
    } catch (error) {
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new SiteUserController();
