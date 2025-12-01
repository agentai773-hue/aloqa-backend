const express = require('express');
const LeadController = require('../controllers/leadController');
const clientAuthMiddleware = require('../../middleware/clientMiddleware');

const router = express.Router();
const leadController = new LeadController();

// Check if lead exists by contact number
router.get('/check', clientAuthMiddleware, (req, res) =>
  leadController.checkLeadExists(req, res)
);

// Create a new lead
router.post('/create', clientAuthMiddleware, (req, res) =>
  leadController.createLead(req, res)
);

// Get all leads
router.get('/all', clientAuthMiddleware, (req, res) =>
  leadController.getAllLeads(req, res)
);

// Get lead by ID
router.get('/:id', clientAuthMiddleware, (req, res) =>
  leadController.getLeadById(req, res)
);

// Update lead
router.put('/:id', clientAuthMiddleware, (req, res) =>
  leadController.updateLead(req, res)
);

// Delete lead
router.delete('/:id', clientAuthMiddleware, (req, res) =>
  leadController.deleteLead(req, res)
);

// Import leads from CSV
router.post('/import/csv', clientAuthMiddleware, (req, res) =>
  leadController.importLeads(req, res)
);

// Search leads with filters
router.post('/search', clientAuthMiddleware, (req, res) =>
  leadController.searchLeads(req, res)
);

module.exports = router;

