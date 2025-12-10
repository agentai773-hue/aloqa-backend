const { body, param } = require('express-validator');

/**
 * Admin User Creation Validation
 * Validates all required fields for creating a new user
 */
const userCreationValidation = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2-50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),

  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2-50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),

  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Email must not exceed 100 characters'),

  body('mobile')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid 10-digit Indian mobile number'),

  body('companyName')
    .trim()
    .notEmpty()
    .withMessage('Company name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2-100 characters'),

  body('companyAddress')
    .trim()
    .notEmpty()
    .withMessage('Company address is required')
    .isLength({ min: 2, max: 500 })
    .withMessage('Company address must be between 2-500 characters'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    })
];

/**
 * Admin User Update Validation
 * Validates fields for updating an existing user (all optional except ID)
 */
const userUpdateValidation = [
  param('id')
    .isMongoId()
    .withMessage('Please provide a valid user ID'),

  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2-50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),

  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2-50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Email must not exceed 100 characters'),

  body('mobile')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid 10-digit Indian mobile number'),

  body('companyName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Company name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2-100 characters'),

  body('companyAddress')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Company address cannot be empty')
    .isLength({ min: 2, max: 500 })
    .withMessage('Company address must be between 2-500 characters'),

  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  body('confirmPassword')
    .optional()
    .custom((value, { req }) => {
      if (req.body.password && value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    })
];

/**
 * User ID Parameter Validation
 * Validates MongoDB ObjectId for user operations
 */
const userIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Please provide a valid user ID')
];

/**
 * User Approval Validation
 * Validates user approval/disapproval action
 */
const userApprovalValidation = [
  param('id')
    .isMongoId()
    .withMessage('Please provide a valid user ID'),

  body('isApproved')
    .optional()
    .isBoolean()
    .withMessage('Approval status must be boolean (true or false)')
];

/**
 * Manual Email Verification Validation
 * Validates manual email verification action by admin
 */
const emailVerificationValidation = [
  param('id')
    .isMongoId()
    .withMessage('Please provide a valid user ID'),

  body('isEmailVerified')
    .optional()
    .isBoolean()
    .withMessage('Email verification status must be boolean (true or false)')
];

module.exports = {
  userCreationValidation,
  userUpdateValidation,
  userIdValidation,
  userApprovalValidation,
  emailVerificationValidation
};