const { validationResult } = require('express-validator');
const authService = require('../services/authService');

// @desc    Login admin
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
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

    const { email, password } = req.body;

    // Call service
    const result = await authService.login(email, password);

    // Send response
    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });

  } catch (error) {
    console.error('Login error:', error);
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      message: error.message || 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    // Call service
    const result = await authService.refreshToken(token);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: result
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    const status = error.status || 401;
    res.status(status).json({
      success: false,
      message: error.message || 'Invalid or expired refresh token'
    });
  }
};

// @desc    Get current admin profile
// @route   GET /api/auth/me
// @access  Private
const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        admin: req.admin
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving profile'
    });
  }
};

// @desc    Verify token
// @route   GET /api/auth/verify  
// @access  Private
const verifyToken = async (req, res) => {
  try {
    // Token is already verified by middleware, just return admin data
    res.json({
      success: true,
      message: 'Token verified successfully',
      data: {
        valid: true,
        admin: req.admin
      }
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(401).json({
      success: false,
      message: 'Token verification failed',
      data: {
        valid: false
      }
    });
  }
};

const logout = async (req, res) => {
  try {
    // Call service
    await authService.logout(req.admin.id);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

// @desc    Update admin profile
// @route   PUT /api/admin/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const adminId = req.admin.id;

    // Basic validation
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Call service to update profile
    const result = await authService.updateProfile(adminId, { name, email });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: result
    });

  } catch (error) {
    console.error('Update profile error:', error);
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      message: error.message || 'Server error updating profile'
    });
  }
};

module.exports = {
  login,
  refreshToken,
  getProfile,
  verifyToken,
  logout,
  updateProfile
};