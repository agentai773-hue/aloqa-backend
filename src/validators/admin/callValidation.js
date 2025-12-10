const { body } = require('express-validator');

const callValidation = {
  // Validation for making a sample call
  makeSampleCall: [
    body('phoneNumber')
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^\d{10}$/)
      .withMessage('Phone number must be exactly 10 digits'),
    
    body('recipientName')
      .notEmpty()
      .withMessage('Recipient name is required')
      .isString()
      .withMessage('Recipient name must be a string')
      .isLength({ min: 2, max: 100 })
      .withMessage('Recipient name must be between 2-100 characters')
      .trim(),
    
    body('assistantId')
      .notEmpty()
      .withMessage('Assistant ID is required')
      .isMongoId()
      .withMessage('Invalid Assistant ID format'),
    
    body('fromPhoneNumber')
      .optional()
      .isString()
      .withMessage('From phone number must be a string')
  ]
};

module.exports = callValidation;