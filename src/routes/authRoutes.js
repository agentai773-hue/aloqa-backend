const express = require('express');
const router = express.Router();

const { login, refreshToken, getProfile, logout } = require('../controllers/authController');
const { loginValidation, refreshTokenValidation } = require('../validators/authValidator');
const { protect } = require('../middleware/auth');

// @route   POST /api/auth/login
// @desc    Login admin
// @access  Public
router.post('/login', loginValidation, login);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', refreshTokenValidation, refreshToken);

// @route   GET /api/auth/me
// @desc    Get current admin profile
// @access  Private
router.get('/me', protect, getProfile);

// @route   POST /api/auth/logout
// @desc    Logout admin
// @access  Private
router.post('/logout', protect, logout);

module.exports = router;
