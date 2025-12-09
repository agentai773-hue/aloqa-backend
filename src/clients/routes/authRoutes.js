const express = require('express');
const router = express.Router();
const { login, verify, logout, requestPasswordReset, resetPasswordWithOTP } = require('../controllers/authController');
const { clientLoginValidation, handleValidationErrors } = require('../../validators/client/authValidation');
const clientAuthMiddleware = require('../../middleware/clientMiddleware');

// Client login route
router.post('/login', clientLoginValidation, handleValidationErrors, (req, res, next) =>
  login(req, res, next)
);

// Client verify route
router.post('/verify', (req, res) =>
  verify(req, res)
);

// Client logout route (requires authentication)
router.post('/logout', clientAuthMiddleware, (req, res) =>
  logout(req, res)
);

// Request password reset - send OTP to email
router.post('/forgot-password/request', (req, res) =>
  requestPasswordReset(req, res)
);

// Reset password with OTP
router.post('/forgot-password/reset', (req, res) =>
  resetPasswordWithOTP(req, res)
);

module.exports = router;