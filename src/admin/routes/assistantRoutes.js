const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistantController');
const { protect } = require('../../middleware/auth');

// All routes require authentication
router.use(protect);

// ==================== ADMIN ASSISTANT MANAGEMENT API ENDPOINTS ====================

/**
 * @route   POST /api/admin/assistants/create
 * @desc    Create a new assistant
 * @access  Private (Admin only)
 */
router.post('/create', assistantController.createAssistant);

/**
 * @route   GET /api/admin/assistants/list
 * @desc    Get all assistants (with optional filters)
 * @access  Private (Admin only)
 */
router.get('/list', assistantController.getAllAssistants);

/**
 * @route   GET /api/admin/assistants/get/:id
 * @desc    Get assistant by ID
 * @access  Private (Admin only)
 */
router.get('/get/:id', assistantController.getAssistantById);

/**
 * @route   PUT /api/admin/assistants/update/:id
 * @desc    Update assistant (database only - legacy)
 * @access  Private (Admin only)
 */
router.put('/update/:id', assistantController.updateAssistant);

/**
 * @route   PATCH /api/admin/assistants/patch/:id
 * @desc    Patch update assistant (partial update to Bolna AI)
 * @access  Private (Admin only)
 */
router.patch('/patch/:id', assistantController.patchAssistant);

/**
 * @route   DELETE /api/admin/assistants/delete/:id
 * @desc    Delete assistant (hard delete from DB + Bolna AI)
 * @access  Private (Admin only)
 */
router.delete('/delete/:id', assistantController.deleteAssistant);

/**
 * @route   GET /api/admin/assistants/user/:userId
 * @desc    Get all assistants for a specific user
 * @access  Private (Admin only)
 */
router.get('/user/:userId', assistantController.getAssistantsByUser);

module.exports = router;
