const express = require('express');
const router = express.Router();
const siteUserController = require('../controllers/siteUserController');
const clientMiddleware = require('../../middleware/clientMiddleware');

// All routes require authentication
router.use(clientMiddleware);

// Create site user
router.post('/', (req, res) => siteUserController.createSiteUser(req, res));

// Get all site users
router.get('/', (req, res) => siteUserController.getAllSiteUsers(req, res));

// Get single site user
router.get('/:id', (req, res) => siteUserController.getSiteUserById(req, res));

// Update site user
router.put('/:id', (req, res) => siteUserController.updateSiteUser(req, res));

// Delete site user
router.delete('/:id', (req, res) =>
  siteUserController.deleteSiteUser(req, res)
);

// Deactivate site user
router.patch('/:id/deactivate', (req, res) =>
  siteUserController.deactivateSiteUser(req, res)
);

// Activate site user
router.patch('/:id/activate', (req, res) =>
  siteUserController.activateSiteUser(req, res)
);

module.exports = router;
