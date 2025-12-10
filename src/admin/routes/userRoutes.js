const express = require('express');
const userController = require('../controllers/userController');
const { protect } = require('../../middleware/auth');
const {
  userCreationValidation,
  userUpdateValidation,
  userIdValidation,
  userApprovalValidation,
  emailVerificationValidation
} = require('../../validators/admin/userValidator');

const router = express.Router();

// All routes require authentication
router.use(protect);

// ==================== ADMIN USER MANAGEMENT API ENDPOINTS ====================

// @route   GET /api/admin/users/stats
// @desc    Get user statistics (total users, approved, pending, etc.)
// @access  Private (Admin only)
router.get('/stats', userController.getUserStats);

// @route   POST /api/admin/users/create
// @desc    Create a new user
// @access  Private (Admin only)
router.post('/create', userCreationValidation, userController.createUser);

// @route   GET /api/admin/users/list
// @desc    Get all users with pagination and filtering
// @access  Private (Admin only)
router.get('/list', userController.getAllUsers);

// @route   GET /api/admin/users/get/:id
// @desc    Get user by ID
// @access  Private (Admin only)
router.get('/get/:id', userIdValidation, userController.getUserById);

// @route   PUT /api/admin/users/update/:id
// @desc    Update user by ID
// @access  Private (Admin only)
router.put('/update/:id', userUpdateValidation, userController.updateUser);

// @route   DELETE /api/admin/users/delete/:id
// @desc    Delete user by ID
// @access  Private (Admin only)
router.delete('/delete/:id', userIdValidation, userController.deleteUser);

// @route   PATCH /api/admin/users/:id/toggle-approval
// @desc    Toggle user approval status
// @access  Private (Admin only)
router.patch('/:id/toggle-approval', userApprovalValidation, userController.toggleUserApproval);

// @route   PATCH /api/admin/users/:id/verify-email
// @desc    Manual email verification (admin action)
// @access  Private (Admin only)
router.patch('/:id/verify-email', emailVerificationValidation, userController.manuallyVerifyUser);

module.exports = router;
