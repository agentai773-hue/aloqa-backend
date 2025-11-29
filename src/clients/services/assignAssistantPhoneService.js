// clients/services/assignAssistantPhoneService.js
const {
  createAssignment,
  getAssignmentsByUserId,
  getAssignmentsByUserAndProject,
  getAssignmentById,
  checkAssignmentExists,
  updateAssignment,
  deleteAssignment,
  getProjectsByUserId
} = require('../repositories/assignAssistantPhoneRepository');

// Import models for validation
const Assistant = require('../../models/Assistant');
const PhoneNumber = require('../../models/PhoneNumber');

class AssignAssistantPhoneService {
  /**
   * Assign Assistant and Phone to a Project
   */
  async assignAssistantPhone(userId, assistantId, phoneId, projectName) {
    try {
      // Validate that assistant belongs to user
      const assistant = await Assistant.findOne({
        _id: assistantId,
        userId: userId,
        status: { $ne: 'deleted' }
      });

      if (!assistant) {
        return {
          success: false,
          statusCode: 404,
          message: 'Assistant not found or does not belong to this user'
        };
      }

      // Check if phoneId is MongoDB ID or phone number string (for default)
      let phoneNumber;
      const isMongoId = /^[0-9a-fA-F]{24}$/.test(phoneId);

      if (isMongoId) {
        // If it's a MongoDB ID, query by _id
        phoneNumber = await PhoneNumber.findOne({
          _id: phoneId,
          userId: userId,
          status: { $ne: 'deleted' }
        });
      } else {
        // If it's a phone number string, use it as-is (for default number)
        // Create a virtual phone number object for default
        phoneNumber = {
          _id: 'default-number',
          phoneNumber: phoneId,
          country: 'IN',
          friendlyName: 'Default Number',
          isDefault: true
        };
      }

      if (!phoneNumber) {
        return {
          success: false,
          statusCode: 404,
          message: 'Phone number not found or does not belong to this user'
        };
      }

      // For MongoDB query with default number, store the actual phone number
      const phoneIdToStore = isMongoId ? phoneId : phoneId;

      // Check if assignment already exists
      const existingAssignment = await checkAssignmentExists(
        userId,
        assistantId,
        phoneIdToStore,
        projectName
      );

      if (existingAssignment) {
        return {
          success: false,
          statusCode: 400,
          message: 'This assistant and phone are already assigned to this project'
        };
      }

      // Create assignment
      const assignment = await createAssignment({
        userId,
        assistantId,
        phoneId: phoneIdToStore,
        projectName,
        status: 'active'
      });

      return {
        success: true,
        statusCode: 201,
        message: 'Assignment created successfully',
        data: assignment
      };
    } catch (error) {
      console.error('Error in assignAssistantPhone:', error);
      return {
        success: false,
        statusCode: 500,
        message: error.message
      };
    }
  }

  /**
   * Get all assignments for a user
   */
  async getAllAssignments(userId) {
    try {
      const assignments = await getAssignmentsByUserId(userId);

      if (!assignments || assignments.length === 0) {
        return {
          success: true,
          statusCode: 200,
          message: 'No assignments found',
          data: []
        };
      }

      return {
        success: true,
        statusCode: 200,
        message: 'Assignments retrieved successfully',
        data: assignments
      };
    } catch (error) {
      console.error('Error in getAllAssignments:', error);
      return {
        success: false,
        statusCode: 500,
        message: error.message
      };
    }
  }

  /**
   * Get assignments by project
   */
  async getAssignmentsByProject(userId, projectName) {
    try {
      const assignments = await getAssignmentsByUserAndProject(userId, projectName);

      if (!assignments || assignments.length === 0) {
        return {
          success: true,
          statusCode: 200,
          message: 'No assignments found for this project',
          data: []
        };
      }

      return {
        success: true,
        statusCode: 200,
        message: 'Assignments retrieved successfully',
        data: assignments
      };
    } catch (error) {
      console.error('Error in getAssignmentsByProject:', error);
      return {
        success: false,
        statusCode: 500,
        message: error.message
      };
    }
  }

  /**
   * Get single assignment by ID
   */
  async getAssignmentById(assignmentId, userId) {
    try {
      const assignment = await getAssignmentById(assignmentId, userId);

      if (!assignment) {
        return {
          success: false,
          statusCode: 404,
          message: 'Assignment not found'
        };
      }

      return {
        success: true,
        statusCode: 200,
        message: 'Assignment retrieved successfully',
        data: assignment
      };
    } catch (error) {
      console.error('Error in getAssignmentById:', error);
      return {
        success: false,
        statusCode: 500,
        message: error.message
      };
    }
  }

  /**
   * Unassign (delete) an assignment
   */
  async unassignAssistantPhone(assignmentId, userId) {
    try {
      // Verify assignment belongs to user
      const assignment = await getAssignmentById(assignmentId, userId);

      if (!assignment) {
        return {
          success: false,
          statusCode: 404,
          message: 'Assignment not found'
        };
      }

      // Soft delete the assignment
      await deleteAssignment(assignmentId, userId);

      return {
        success: true,
        statusCode: 200,
        message: 'Assignment removed successfully'
      };
    } catch (error) {
      console.error('Error in unassignAssistantPhone:', error);
      return {
        success: false,
        statusCode: 500,
        message: error.message
      };
    }
  }

  /**
   * Get all projects for a user
   */
  async getProjectsList(userId) {
    try {
      const projects = await getProjectsByUserId(userId);

      return {
        success: true,
        statusCode: 200,
        message: 'Projects retrieved successfully',
        data: projects || []
      };
    } catch (error) {
      console.error('Error in getProjectsList:', error);
      return {
        success: false,
        statusCode: 500,
        message: error.message
      };
    }
  }
}

module.exports = AssignAssistantPhoneService;
