const projectService = require('../services/projectService');
const { validationResult } = require('express-validator');

class ProjectController {
  // Get all projects for a client
  async getAllProjects(req, res) {
    try {
      const clientId = req.user.id;
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        search: req.query.search,
        status: req.query.status
      };

      // Debug: Log the request to see what's happening
      console.log('Projects Controller - Client ID:', clientId);
      console.log('Projects Controller - Filters:', filters);

      const result = await projectService.getAllProjects(clientId, filters);
      
      // Debug: Log the result before sending response
      console.log('Projects Controller - Result pagination:', result.pagination);
      console.log('Projects Controller - Result data length:', result.data?.length);
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getAllProjects controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch projects'
      });
    }
  }

  // Get single project
  async getProject(req, res) {
    try {
      const { id } = req.params;
      const clientId = req.user.id;

      const result = await projectService.getProject(id, clientId);
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getProject controller:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch project'
      });
    }
  }

  // Create new project
  async createProject(req, res) {
    console.log(req,"ahdasdhaskjdhjaks");
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const clientId = req.user.id;
      const projectData = req.body;

      const result = await projectService.createProject(clientId, projectData);
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Error in createProject controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create project'
      });
    }
  }

  // Update project
  async updateProject(req, res) {
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
      const clientId = req.user.id;
      const updateData = req.body;

      const result = await projectService.updateProject(id, clientId, updateData);
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in updateProject controller:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update project'
      });
    }
  }

  // Delete project
  async deleteProject(req, res) {
    try {
      const { id } = req.params;
      const clientId = req.user.id;

      const result = await projectService.deleteProject(id, clientId);
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in deleteProject controller:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete project'
      });
    }
  }

  // Get project statistics
  async getProjectStats(req, res) {
    try {
      const clientId = req.user.id;

      const result = await projectService.getProjectStats(clientId);
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getProjectStats controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch project statistics'
      });
    }
  }
}

module.exports = new ProjectController();