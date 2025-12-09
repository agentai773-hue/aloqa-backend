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
    .isIn(['planning', 'in-progress', 'on-hold', 'completed', 'cancelled'])
    .withMessage('Invalid status value'),

  body('phoneNumberId')
    .notEmpty()
    .withMessage('Phone number is required')
    .isMongoId()
    .withMessage('Invalid phone number ID'),

  body('assistantId')
    .optional()
    .isMongoId()
    .withMessage('Invalid assistant ID')
];

const updateProjectValidation = [
  body('projectName')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Project name must be between 3 and 100 characters'),
    
  body('projectStatus')
    .optional()
    .isIn(['planning', 'in-progress', 'on-hold', 'completed', 'cancelled'])
    .withMessage('Invalid status value'),

  body('phoneNumberId')
    .optional()
    .isMongoId()
    .withMessage('Invalid phone number ID'),

  body('assistantId')
    .optional()
    .isMongoId()
    .withMessage('Invalid assistant ID')
];

module.exports = {
  createProjectValidation,
  updateProjectValidation
};
