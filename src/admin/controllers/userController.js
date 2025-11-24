const { validationResult } = require('express-validator');
const userService = require('../services/userService');

// @desc    Create new user
// @route   POST /api/users
// @access  Private (Admin only)
const createUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = await userService.createUser(req.body);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Create user error:', error);
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      message: error.message || 'Server error creating user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const { page, limit, isApproval } = req.query;
    
    const filters = {};
    if (isApproval !== undefined) {
      filters.isApproval = parseInt(isApproval);
    }
    if (page) filters.page = parseInt(page);
    if (limit) filters.limit = parseInt(limit);

    const result = await userService.getAllUsers(filters);

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: result
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving users'
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Admin only)
const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);

    res.json({
      success: true,
      message: 'User retrieved successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Get user error:', error);
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      message: error.message || 'Server error retrieving user'
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin only)
const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = await userService.updateUser(req.params.id, req.body);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Update user error:', error);
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      message: error.message || 'Server error updating user'
    });
  }
};

// @desc    Toggle user approval
// @route   PATCH /api/users/:id/approval
// @access  Private (Admin only)
const toggleUserApproval = async (req, res) => {
  try {
    const { isApproval } = req.body;

    if (isApproval === undefined || ![0, 1].includes(isApproval)) {
      return res.status(400).json({
        success: false,
        message: 'isApproval must be 0 or 1'
      });
    }

    const user = await userService.toggleUserApproval(req.params.id, isApproval);

    res.json({
      success: true,
      message: `User ${isApproval === 1 ? 'approved' : 'unapproved'} successfully`,
      data: { user }
    });

  } catch (error) {
    console.error('Toggle approval error:', error);
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      message: error.message || 'Server error toggling approval'
    });
  }
};

// @desc    Delete user (soft delete)
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res) => {
  try {
    await userService.deleteUser(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      message: error.message || 'Server error deleting user'
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private (Admin only)
const getUserStats = async (req, res) => {
  try {
    const stats = await userService.getUserStats();

    res.json({
      success: true,
      message: 'User statistics retrieved successfully',
      data: stats
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving statistics'
    });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  toggleUserApproval,
  deleteUser,
  getUserStats
};
