const assignUserVoiceService = require('../services/assignUserVoiceService');
const { validationResult } = require('express-validator');

const assignUserVoiceController = {
  // Assign a voice to user
  assignVoiceToUser: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const assignment = await assignUserVoiceService.assignVoiceToUser(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Voice assigned to user successfully',
        data: assignment
      });
    } catch (error) {
      console.error('Error assigning voice to user:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to assign voice to user'
      });
    }
  },

  // Get all voice assignments
  getAllAssignments: async (req, res) => {
    try {
      const { page = 1, limit = 10, userId, status, search } = req.query;
      
      const result = await assignUserVoiceService.getAllAssignments({
        page: parseInt(page),
        limit: parseInt(limit),
        userId,
        status,
        search
      });

      res.status(200).json({
        success: true,
        message: 'Voice assignments retrieved successfully',
        data: result.assignments,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      console.error('Error getting voice assignments:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get voice assignments'
      });
    }
  },

  // Get assignments by user ID
  getAssignmentsByUser: async (req, res) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10, status } = req.query;

      const result = await assignUserVoiceService.getAssignmentsByUser(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        status
      });

      res.status(200).json({
        success: true,
        message: 'User voice assignments retrieved successfully',
        data: result.assignments,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      console.error('Error getting user voice assignments:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get user voice assignments'
      });
    }
  },

  // Get single assignment
  getAssignmentById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const assignment = await assignUserVoiceService.getAssignmentById(id);
      
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Voice assignment not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Voice assignment retrieved successfully',
        data: assignment
      });
    } catch (error) {
      console.error('Error getting voice assignment:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get voice assignment'
      });
    }
  },

  // Update assignment
  updateAssignment: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const assignment = await assignUserVoiceService.updateAssignment(id, req.body);
      
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Voice assignment not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Voice assignment updated successfully',
        data: assignment
      });
    } catch (error) {
      console.error('Error updating voice assignment:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update voice assignment'
      });
    }
  },

  // Delete assignment (soft delete)
  deleteAssignment: async (req, res) => {
    try {
      const { id } = req.params;
      
      const assignment = await assignUserVoiceService.deleteAssignment(id);
      
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Voice assignment not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Voice assignment deleted successfully',
        data: assignment
      });
    } catch (error) {
      console.error('Error deleting voice assignment:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete voice assignment'
      });
    }
  },

  // Update assignment status
  updateAssignmentStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be active or inactive.'
        });
      }

      const assignment = await assignUserVoiceService.updateAssignmentStatus(id, status);
      
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Voice assignment not found'
        });
      }

      res.status(200).json({
        success: true,
        message: `Voice assignment ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
        data: assignment
      });
    } catch (error) {
      console.error('Error updating voice assignment status:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update voice assignment status'
      });
    }
  }
};

module.exports = assignUserVoiceController;