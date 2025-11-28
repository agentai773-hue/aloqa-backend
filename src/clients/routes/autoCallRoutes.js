const express = require('express');
const router = express.Router();
const autoCallController = require('../controllers/autoCallController');
const clientAuthMiddleware = require('../../middleware/clientMiddleware');

// Auto-call service endpoints
router.post('/start', clientAuthMiddleware, autoCallController.startAutoCallService);
router.post('/stop', clientAuthMiddleware, autoCallController.stopAutoCallService);
router.get('/status', clientAuthMiddleware, autoCallController.getAutoCallServiceStatus);

module.exports = router;
