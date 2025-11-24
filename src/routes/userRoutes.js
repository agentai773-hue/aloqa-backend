const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const userValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('mobile').matches(/^[0-9]{10,15}$/).withMessage('Valid mobile number is required'),
  body('companyName').trim().notEmpty().withMessage('Company name is required'),
  body('companyAddress').trim().notEmpty().withMessage('Company address is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
];

const updateUserValidation = [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('mobile').optional().matches(/^[0-9]{10,15}$/).withMessage('Valid mobile number is required'),
  body('companyName').optional().trim().notEmpty().withMessage('Company name cannot be empty'),
  body('companyAddress').optional().trim().notEmpty().withMessage('Company address cannot be empty'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword').optional().custom((value, { req }) => {
    if (req.body.password && value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
];

// All routes require authentication
router.use(protect);

// User statistics - must come before /:id route
router.get('/stats', userController.getUserStats);

// CRUD routes
router.post('/', userValidation, userController.createUser);
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', updateUserValidation, userController.updateUser);
router.delete('/:id', userController.deleteUser);

// Toggle approval
router.patch('/:id/approval', userController.toggleUserApproval);

module.exports = router;
