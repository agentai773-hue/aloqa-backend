const express = require('express');
const router = express.Router();
const assignUserVoiceController = require('../controllers/assignUserVoiceController');
const assignUserVoiceValidation = require('../../validators/admin/assignUserVoiceValidation');
const { protect } = require('../../middleware/auth');

// Apply authentication middleware to all routes
router.use(protect);

// POST /admin/assign-user-voice - Assign voice to user
router.post(
  '/',
  assignUserVoiceValidation.assignVoiceToUser,
  assignUserVoiceController.assignVoiceToUser
);

// GET /admin/assign-user-voice - Get all voice assignments with pagination and filters
router.get(
  '/',
  assignUserVoiceValidation.getAllAssignments,
  assignUserVoiceController.getAllAssignments
);

// GET /admin/assign-user-voice/user/:userId - Get assignments by user ID
router.get(
  '/user/:userId',
  assignUserVoiceValidation.getAssignmentsByUser,
  assignUserVoiceController.getAssignmentsByUser
);

// GET /admin/assign-user-voice/:id - Get single assignment by ID
router.get(
  '/:id',
  assignUserVoiceValidation.getAssignmentById,
  assignUserVoiceController.getAssignmentById
);

// PUT /admin/assign-user-voice/:id - Update assignment
router.put(
  '/:id',
  assignUserVoiceValidation.updateAssignment,
  assignUserVoiceController.updateAssignment
);

// PATCH /admin/assign-user-voice/:id/status - Update assignment status
router.patch(
  '/:id/status',
  assignUserVoiceValidation.updateAssignmentStatus,
  assignUserVoiceController.updateAssignmentStatus
);

// DELETE /admin/assign-user-voice/:id - Delete assignment (soft delete)
router.delete(
  '/:id',
  assignUserVoiceValidation.deleteAssignment,
  assignUserVoiceController.deleteAssignment
);

module.exports = router;