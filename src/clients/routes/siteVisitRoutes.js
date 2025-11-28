const express = require('express');
const router = express.Router();
const clientMiddleware = require('../../middleware/clientMiddleware');
const siteVisitController = require('../controllers/siteVisitController');
const {
  validateCreateSiteVisit,
  validateUpdateSiteVisit,
  validateSiteVisitId,
  validateLeadId,
  handleValidationErrors,
} = require('../validators/siteVisitValidation');

// Protected routes - require authentication
router.use(clientMiddleware);

// Create site visit
router.post('/', validateCreateSiteVisit, handleValidationErrors, (req, res) =>
  siteVisitController.createSiteVisit(req, res)
);

// Get all site visits for a lead
router.get('/lead/:leadId', validateLeadId, handleValidationErrors, (req, res) =>
  siteVisitController.getSiteVisitsByLeadId(req, res)
);

// Get upcoming site visits for a lead
router.get('/lead/:leadId/upcoming', validateLeadId, handleValidationErrors, (req, res) =>
  siteVisitController.getUpcomingSiteVisits(req, res)
);

// Get completed site visits for a lead
router.get('/lead/:leadId/completed', validateLeadId, handleValidationErrors, (req, res) =>
  siteVisitController.getCompletedSiteVisits(req, res)
);

// Get specific site visit by ID
router.get('/:id', validateSiteVisitId, handleValidationErrors, (req, res) =>
  siteVisitController.getSiteVisitById(req, res)
);

// Update site visit
router.put('/:id', validateSiteVisitId, validateUpdateSiteVisit, handleValidationErrors, (req, res) =>
  siteVisitController.updateSiteVisit(req, res)
);

// Delete site visit
router.delete('/:id', validateSiteVisitId, handleValidationErrors, (req, res) =>
  siteVisitController.deleteSiteVisit(req, res)
);

// Extract and create site visit from transcript
router.post('/extract/transcript', (req, res) =>
  siteVisitController.extractSiteVisitFromTranscript(req, res)
);

module.exports = router;
