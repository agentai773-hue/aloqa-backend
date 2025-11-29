const express = require('express');
const router = express.Router();

const { login, refreshToken, getProfile, verifyToken, logout, updateProfile } = require('../controllers/authController');
const { loginValidation, refreshTokenValidation } = require('../../validators/authValidator');
const { protect } = require('../../middleware/auth');

// @route   POST /api/admin/auth/login
// @desc    Login admin
// @access  Public
router.post('/login', loginValidation, login);

// @route   POST /api/admin/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', refreshTokenValidation, refreshToken);

// @route   GET /api/admin/auth/verify
// @desc    Verify current token
// @access  Private
router.get('/verify', protect, verifyToken);

// @route   GET /api/admin/auth/me
// @desc    Get current admin profile
// @access  Private
router.get('/me', protect, getProfile);

// @route   PUT /api/admin/auth/profile
// @desc    Update admin profile
// @access  Private
router.put('/profile', protect, updateProfile);

// @route   POST /api/admin/auth/logout
// @desc    Logout admin
// @access  Private
router.post('/logout', protect, logout);

module.exports = router;
