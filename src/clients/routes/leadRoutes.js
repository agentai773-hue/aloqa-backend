const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { 
  leadValidation, 
  bulkLeadValidation, 
  updateLeadValidation, 
  handleValidationErrors 
} = require('../../validators/client/leadValidation');
const clientAuthMiddleware = require('../../middleware/clientMiddleware');

// Apply authentication middleware to all routes
router.use(clientAuthMiddleware);

// Create single lead
router.post('/', leadValidation, handleValidationErrors, (req, res) => 
  leadController.create(req, res)
);

// Create multiple leads
router.post('/bulk', bulkLeadValidation, handleValidationErrors, (req, res) => 
  leadController.createBulk(req, res)
);

// Get all leads (with pagination and filtering)
router.get('/', (req, res) => 
  leadController.getAll(req, res)
);

// Get lead statistics
router.get('/stats', (req, res) => 
  leadController.getStats(req, res)
);

// Get lead by ID
router.get('/:id', (req, res) => 
  leadController.getById(req, res)
);

// Update lead
router.put('/:id', updateLeadValidation, handleValidationErrors, (req, res) => 
  leadController.update(req, res)
);

// Delete lead (soft delete)
router.delete('/:id', (req, res) => 
  leadController.delete(req, res)
);

module.exports = router;