const express = require('express');
const router = express.Router();
const assignUserVoiceController = require('../controllers/assignUserVoiceController');
const assignUserVoiceValidation = require('../../validators/admin/assignUserVoiceValidation');
const { protect } = require('../../middleware/auth');

// Apply authentication middleware to all routes
router.use(protect);

// ==================== ADMIN USER VOICE ASSIGNMENT API ENDPOINTS ====================

// @route   POST /api/admin/assign-user-voice/assign
// @desc    Assign voice to user
// @access  Private (Admin only)
router.post(
  '/assign',
  assignUserVoiceValidation.assignVoiceToUser,
  assignUserVoiceController.assignVoiceToUser
);

// @route   GET /api/admin/assign-user-voice/list
// @desc    Get all voice assignments with pagination and filters
// @access  Private (Admin only)
router.get(
  '/list',
  assignUserVoiceValidation.getAllAssignments,
  assignUserVoiceController.getAllAssignments
);

// @route   GET /api/admin/assign-user-voice/user/:userId
// @desc    Get assignments by user ID
// @access  Private (Admin only)
router.get(
  '/user/:userId',
  assignUserVoiceValidation.getAssignmentsByUser,
  assignUserVoiceController.getAssignmentsByUser
);

// @route   GET /api/admin/assign-user-voice/get/:id
// @desc    Get single assignment by ID
// @access  Private (Admin only)
router.get(
  '/get/:id',
  assignUserVoiceValidation.getAssignmentById,
  assignUserVoiceController.getAssignmentById
);

// @route   PUT /api/admin/assign-user-voice/update/:id
// @desc    Update assignment
// @access  Private (Admin only)
router.put(
  '/update/:id',
  assignUserVoiceValidation.updateAssignment,
  assignUserVoiceController.updateAssignment
);

// @route   PATCH /api/admin/assign-user-voice/:id/update-status
// @desc    Update assignment status
// @access  Private (Admin only)
router.patch(
  '/:id/update-status',
  assignUserVoiceValidation.updateAssignmentStatus,
  assignUserVoiceController.updateAssignmentStatus
);

// @route   DELETE /api/admin/assign-user-voice/delete/:id
// @desc    Delete assignment (soft delete)
// @access  Private (Admin only)
router.delete(
  '/delete/:id',
  assignUserVoiceValidation.deleteAssignment,
  assignUserVoiceController.deleteAssignment
);

module.exports = router;