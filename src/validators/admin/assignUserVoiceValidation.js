const { body, param, query } = require('express-validator');

const assignUserVoiceValidation = {
  // Validation for assigning voice to user
  assignVoiceToUser: [
    body('userId')
      .notEmpty()
      .withMessage('User ID is required')
      .isMongoId()
      .withMessage('Invalid User ID format'),
    
    body('voiceId')
      .notEmpty()
      .withMessage('Voice ID is required')
      .isString()
      .withMessage('Voice ID must be a string')
      .trim(),
    
    body('voiceName')
      .notEmpty()
      .withMessage('Voice name is required')
      .isString()
      .withMessage('Voice name must be a string')
      .isLength({ min: 1, max: 100 })
      .withMessage('Voice name must be between 1-100 characters')
      .trim(),
    
    body('voiceProvider')
      .optional()
      .isIn(['elevenlabs'])
      .withMessage('Voice provider must be elevenlabs'),
    
    body('voiceAccent')
      .optional()
      .isString()
      .withMessage('Voice accent must be a string')
      .isLength({ max: 50 })
      .withMessage('Voice accent cannot exceed 50 characters')
      .trim(),
    
    body('voiceModel')
      .optional()
      .isString()
      .withMessage('Voice model must be a string')
      .isLength({ max: 50 })
      .withMessage('Voice model cannot exceed 50 characters')
      .trim(),
    
    body('projectName')
      .notEmpty()
      .withMessage('Project name is required')
      .isString()
      .withMessage('Project name must be a string')
      .isLength({ min: 1, max: 100 })
      .withMessage('Project name must be between 1-100 characters')
      .trim(),
    
    body('description')
      .optional()
      .isString()
      .withMessage('Description must be a string')
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters')
      .trim()
  ],

  // Validation for updating assignment
  updateAssignment: [
    param('id')
      .notEmpty()
      .withMessage('Assignment ID is required')
      .isMongoId()
      .withMessage('Invalid Assignment ID format'),
    
    body('voiceId')
      .optional()
      .isString()
      .withMessage('Voice ID must be a string')
      .trim(),
    
    body('voiceName')
      .optional()
      .isString()
      .withMessage('Voice name must be a string')
      .isLength({ min: 1, max: 100 })
      .withMessage('Voice name must be between 1-100 characters')
      .trim(),
    
    body('voiceAccent')
      .optional()
      .isString()
      .withMessage('Voice accent must be a string')
      .isLength({ max: 50 })
      .withMessage('Voice accent cannot exceed 50 characters')
      .trim(),
    
    body('voiceModel')
      .optional()
      .isString()
      .withMessage('Voice model must be a string')
      .isLength({ max: 50 })
      .withMessage('Voice model cannot exceed 50 characters')
      .trim(),
    
    body('projectName')
      .optional()
      .isString()
      .withMessage('Project name must be a string')
      .isLength({ min: 1, max: 100 })
      .withMessage('Project name must be between 1-100 characters')
      .trim(),
    
    body('description')
      .optional()
      .isString()
      .withMessage('Description must be a string')
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters')
      .trim(),
    
    body('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('Status must be active or inactive')
  ],

  // Validation for getting assignment by ID
  getAssignmentById: [
    param('id')
      .notEmpty()
      .withMessage('Assignment ID is required')
      .isMongoId()
      .withMessage('Invalid Assignment ID format')
  ],

  // Validation for getting assignments by user
  getAssignmentsByUser: [
    param('userId')
      .notEmpty()
      .withMessage('User ID is required')
      .isMongoId()
      .withMessage('Invalid User ID format'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('status')
      .optional()
      .isIn(['active', 'inactive', 'all'])
      .withMessage('Status must be active, inactive, or all')
  ],

  // Validation for getting all assignments
  getAllAssignments: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('userId')
      .optional()
      .isMongoId()
      .withMessage('Invalid User ID format'),
    
    query('status')
      .optional()
      .isIn(['active', 'inactive', 'all'])
      .withMessage('Status must be active, inactive, or all'),
    
    query('search')
      .optional()
      .isString()
      .withMessage('Search must be a string')
      .isLength({ min: 1, max: 100 })
      .withMessage('Search must be between 1-100 characters')
      .trim()
  ],

  // Validation for deleting assignment
  deleteAssignment: [
    param('id')
      .notEmpty()
      .withMessage('Assignment ID is required')
      .isMongoId()
      .withMessage('Invalid Assignment ID format')
  ],

  // Validation for updating assignment status
  updateAssignmentStatus: [
    param('id')
      .notEmpty()
      .withMessage('Assignment ID is required')
      .isMongoId()
      .withMessage('Invalid Assignment ID format'),
    
    body('status')
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['active', 'inactive'])
      .withMessage('Status must be active or inactive')
  ]
};

module.exports = assignUserVoiceValidation;