// clients/routes/assignAssistantPhoneRoutes.js
const express = require('express');
const { param, body } = require('express-validator');
const clientAuthMiddleware = require('../../middleware/clientMiddleware');
const {
  assignAssistantPhone,
  getAllAssignments,
  getAssignmentsByProject,
  getAssignmentById,
  unassignAssistantPhone,
  getProjectsList
} = require('../controllers/assignAssistantPhoneController');
const {
  assignAssistantPhoneValidation,
  unassignAssistantPhoneValidation,
  getAssignmentByIdValidation,
  getAssignmentsByProjectValidation
} = require('../../validators/assignAssistantPhoneValidation');

const router = express.Router();

/**
 * POST /client-assign-assistant-phone
 * Assign Assistant and Phone to a Project
 */
router.post(
  '/',
  clientAuthMiddleware,
  assignAssistantPhoneValidation,
  assignAssistantPhone
);

/**
 * GET /client-assign-assistant-phone
 * Get all assignments for user
 */
router.get('/', clientAuthMiddleware, getAllAssignments);

/**
 * GET /client-assign-assistant-phone/projects/list
 * Get all projects for user
 */
router.get('/projects/list', clientAuthMiddleware, getProjectsList);

/**
 * POST /client-assign-assistant-phone/by-project
 * Get assignments by project name
 */
router.post(
  '/by-project',
  clientAuthMiddleware,
  getAssignmentsByProjectValidation,
  getAssignmentsByProject
);

/**
 * GET /client-assign-assistant-phone/:id
 * Get single assignment by ID
 */
router.get(
  '/:id',
  clientAuthMiddleware,
  param('id').isMongoId().withMessage('Invalid assignment ID format'),
  getAssignmentById
);

/**
 * DELETE /client-assign-assistant-phone/:id
 * Unassign (delete) an assignment
 */
router.delete(
  '/:id',
  clientAuthMiddleware,
  param('id').isMongoId().withMessage('Invalid assignment ID format'),
  unassignAssistantPhone
);

module.exports = router;
