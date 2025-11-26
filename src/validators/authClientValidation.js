const { body, validationResult } = require('express-validator');

// Client Login Validation
const clientLoginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address'),
    // .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

// Client Register Validation
const clientRegisterValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address'),
    // .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim()
];

// Refresh Token Validation
const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
];

// Validation error handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }
  next();
};

module.exports = {
  clientLoginValidation,
  clientRegisterValidation,
  refreshTokenValidation,
  handleValidationErrors
};
