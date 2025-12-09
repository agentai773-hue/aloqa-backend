const { body, validationResult } = require('express-validator');

// Lead validation rules
const leadValidation = [
  body('leadName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Lead name must be between 1 and 100 characters'),
  
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Full name must be between 1 and 100 characters'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[\d\s\-()]{10,15}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Location must be less than 200 characters'),
  
  body('interestedProject')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Interested project must be less than 100 characters'),
  
  body('leadType')
    .optional()
    .isIn(['fake', 'cold', 'hot'])
    .withMessage('Lead type must be one of: fake, cold, hot'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  
  body('status')
    .optional()
    .isIn(['new', 'old'])
    .withMessage('Status must be one of: new, old'),
];

// Bulk lead validation
const bulkLeadValidation = [
  body('leads')
    .isArray({ min: 1 })
    .withMessage('Leads must be an array with at least one item'),
  
  body('leads.*.leadName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Lead name must be between 1 and 100 characters'),
  
  body('leads.*.fullName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Full name must be between 1 and 100 characters'),
  
  body('leads.*.phone')
    .optional()
    .trim()
    .matches(/^[+]?[\d\s\-()]{10,15}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('leads.*.email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('leads.*.leadType')
    .optional()
    .isIn(['fake', 'cold', 'hot'])
    .withMessage('Lead type must be one of: fake, cold, hot'),
  
  body('leads.*.status')
    .optional()
    .isIn(['new', 'old'])
    .withMessage('Status must be one of: new, old'),
];

// Update lead validation (more flexible)
const updateLeadValidation = [
  body('leadName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Lead name must be between 1 and 100 characters'),
  
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Full name must be between 1 and 100 characters'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[\d\s\-()]{10,15}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('leadType')
    .optional()
    .isIn(['fake', 'cold', 'hot'])
    .withMessage('Lead type must be one of: fake, cold, hot'),
  
  body('status')
    .optional()
    .isIn(['new', 'old'])
    .withMessage('Status must be one of: new, old'),
];

// Handle validation errors middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

module.exports = {
  leadValidation,
  bulkLeadValidation,
  updateLeadValidation,
  handleValidationErrors
};