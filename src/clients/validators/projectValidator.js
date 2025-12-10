const { body } = require('express-validator');

const createProjectValidation = [
  body('projectName')
    .trim()
    .notEmpty()
    .withMessage('Project name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Project name must be between 3 and 100 characters'),
    
  body('projectStatus')
    .optional()
    .isIn(['planning', 'in-progress', 'on-hold', 'completed', 'cancelled', 'testing', 'draft'])
    .withMessage('Invalid status value'),

  body('phoneNumberId')
    .notEmpty()
    .withMessage('Phone number is required')
    .isMongoId()
    .withMessage('Invalid phone number ID'),

  body('assistantId')
    .notEmpty()
    .withMessage('Assistant is required')
    .isMongoId()
    .withMessage('Invalid assistant ID'),

  body('assistantName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Assistant name cannot exceed 100 characters'),

  body('phoneNumber')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number cannot exceed 20 characters')
];

const updateProjectValidation = [
  body('projectName')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Project name must be between 3 and 100 characters'),
    
  body('projectStatus')
    .optional()
    .isIn(['planning', 'in-progress', 'on-hold', 'completed', 'cancelled', 'testing', 'draft'])
    .withMessage('Invalid status value'),

  body('phoneNumberId')
    .optional()
    .isMongoId()
    .withMessage('Invalid phone number ID'),

  body('assistantId')
    .optional()
    .isMongoId()
    .withMessage('Invalid assistant ID'),

  body('assistantName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Assistant name cannot exceed 100 characters'),

  body('phoneNumber')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number cannot exceed 20 characters')
];

module.exports = {
  createProjectValidation,
  updateProjectValidation
};
