const { body, validationResult, param } = require('express-validator');

const validateCreateSiteVisit = [
  body('leadId')
    .notEmpty()
    .withMessage('Lead ID is required')
    .isMongoId()
    .withMessage('Invalid lead ID format'),
  body('visitDate')
    .notEmpty()
    .withMessage('Visit date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('visitTime')
    .notEmpty()
    .withMessage('Visit time is required')
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('Time must be in HH:MM format'),
  body('projectName')
    .notEmpty()
    .withMessage('Project name is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Project name must be 2-100 characters'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address must be less than 200 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  body('status')
    .optional()
    .isIn(['scheduled', 'completed', 'cancelled', 'rescheduled'])
    .withMessage('Invalid status'),
];

const validateUpdateSiteVisit = [
  body('visitDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('visitTime')
    .optional()
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('Time must be in HH:MM format'),
  body('projectName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Project name must be 2-100 characters'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address must be less than 200 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  body('status')
    .optional()
    .isIn(['scheduled', 'completed', 'cancelled', 'rescheduled'])
    .withMessage('Invalid status'),
];

const validateSiteVisitId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid site visit ID format'),
];

const validateLeadId = [
  param('leadId')
    .isMongoId()
    .withMessage('Invalid lead ID format'),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

module.exports = {
  validateCreateSiteVisit,
  validateUpdateSiteVisit,
  validateSiteVisitId,
  validateLeadId,
  handleValidationErrors,
};
