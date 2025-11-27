const { body, param, validationResult } = require('express-validator');

// Assign Assistant and Phone to Project Validation
const assignAssistantPhoneValidation = [
  body('assistantId')
    .notEmpty()
    .withMessage('Assistant ID is required')
    .isMongoId()
    .withMessage('Invalid Assistant ID format'),
  
  body('phoneId')
    .notEmpty()
    .withMessage('Phone Number ID is required')
    .custom((value) => {
      // Accept either MongoDB ID or phone number string (for default number)
      const isMongoId = /^[0-9a-fA-F]{24}$/.test(value);
      const isPhoneNumber = /^\+?[\d\s\-()]+$/.test(value);
      
      if (!isMongoId && !isPhoneNumber) {
        throw new Error('Invalid Phone Number ID or phone number format');
      }
      return true;
    }),
  
  body('projectName')
    .notEmpty()
    .withMessage('Project name is required')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Project name must be at least 2 characters long')
];

// Unassign Assignment Validation
const unassignAssistantPhoneValidation = [
  param('id')
    .notEmpty()
    .withMessage('Assignment ID is required')
    .isMongoId()
    .withMessage('Invalid Assignment ID format')
];

// Get Assignment by ID Validation
const getAssignmentByIdValidation = [
  param('id')
    .notEmpty()
    .withMessage('Assignment ID is required')
    .isMongoId()
    .withMessage('Invalid Assignment ID format')
];

// Get Assignments by Project Validation
const getAssignmentsByProjectValidation = [
  body('projectName')
    .notEmpty()
    .withMessage('Project name is required')
    .trim()
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
  assignAssistantPhoneValidation,
  unassignAssistantPhoneValidation,
  getAssignmentByIdValidation,
  getAssignmentsByProjectValidation,
  handleValidationErrors
};
