const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistantController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/assistants/categories
 * @desc    Get all agent categories
 * @access  Private (Admin only)
 */
router.get('/categories', assistantController.getCategories);

/**
 * @route   POST /api/assistants
 * @desc    Create a new assistant
 * @access  Private (Admin only)
 */
router.post('/', assistantController.createAssistant);

/**
 * @route   GET /api/assistants
 * @desc    Get all assistants (with optional filters)
 * @access  Private (Admin only)
 */
router.get('/', assistantController.getAllAssistants);

/**
 * @route   GET /api/assistants/:id
 * @desc    Get assistant by ID
 * @access  Private (Admin only)
 */
router.get('/:id', assistantController.getAssistantById);

/**
 * @route   PUT /api/assistants/:id
 * @desc    Update assistant (database only - legacy)
 * @access  Private (Admin only)
 */
router.put('/:id', assistantController.updateAssistant);

/**
 * @route   PUT /api/assistants/:id/full
 * @desc    Full update assistant (database + Bolna AI)
 * @access  Private (Admin only)
 */
router.put('/:id/full', assistantController.updateAssistantFull);

/**
 * @route   PATCH /api/assistants/:id
 * @desc    Patch update assistant (partial update to Bolna AI)
 * @access  Private (Admin only)
 */
router.patch('/:id', assistantController.patchAssistant);

/**
 * @route   DELETE /api/assistants/:id
 * @desc    Delete assistant (hard delete from DB + Bolna AI)
 * @access  Private (Admin only)
 */
router.delete('/:id', assistantController.deleteAssistant);

/**
 * @route   GET /api/assistants/user/:userId
 * @desc    Get all assistants for a specific user
 * @access  Private (Admin only)
 */
router.get('/user/:userId', assistantController.getAssistantsByUser);

module.exports = router;
