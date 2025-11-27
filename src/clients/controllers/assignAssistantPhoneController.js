// clients/controllers/assignAssistantPhoneController.js
const { validationResult } = require('express-validator');
const AssignAssistantPhoneService = require('../services/assignAssistantPhoneService');

const assignAssistantPhoneService = new AssignAssistantPhoneService();

/**
 * Assign Assistant and Phone to a Project
 * POST /client-assign-assistant-phone
 */
async function assignAssistantPhone(req, res) {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const userId = req.user._id;
    const { assistantId, phoneId, projectName } = req.body;

    const result = await assignAssistantPhoneService.assignAssistantPhone(
      userId,
      assistantId,
      phoneId,
      projectName
    );

    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Error in assignAssistantPhone controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while assigning assistant and phone'
    });
  }
}

/**
 * Get all assignments for user
 * GET /client-assign-assistant-phone
 */
async function getAllAssignments(req, res) {
  try {
    const userId = req.user._id;

    const result = await assignAssistantPhoneService.getAllAssignments(userId);

    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Error in getAllAssignments controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching assignments'
    });
  }
}

/**
 * Get assignments by project
 * POST /client-assign-assistant-phone/by-project
 */
async function getAssignmentsByProject(req, res) {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const userId = req.user._id;
    const { projectName } = req.body;

    const result = await assignAssistantPhoneService.getAssignmentsByProject(
      userId,
      projectName
    );

    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Error in getAssignmentsByProject controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching assignments by project'
    });
  }
}

/**
 * Get single assignment by ID
 * GET /client-assign-assistant-phone/:id
 */
async function getAssignmentById(req, res) {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const userId = req.user._id;
    const { id } = req.params;

    const result = await assignAssistantPhoneService.getAssignmentById(id, userId);

    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Error in getAssignmentById controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching assignment'
    });
  }
}

/**
 * Unassign (delete) an assignment
 * DELETE /client-assign-assistant-phone/:id
 */
async function unassignAssistantPhone(req, res) {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const userId = req.user._id;
    const { id } = req.params;

    const result = await assignAssistantPhoneService.unassignAssistantPhone(id, userId);

    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Error in unassignAssistantPhone controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while removing assignment'
    });
  }
}

/**
 * Get all projects for user
 * GET /client-assign-assistant-phone/projects/list
 */
async function getProjectsList(req, res) {
  try {
    const userId = req.user._id;

    const result = await assignAssistantPhoneService.getProjectsList(userId);

    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Error in getProjectsList controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching projects list'
    });
  }
}

module.exports = {
  assignAssistantPhone,
  getAllAssignments,
  getAssignmentsByProject,
  getAssignmentById,
  unassignAssistantPhone,
  getProjectsList
};
