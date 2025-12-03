const express = require('express');
const router = express.Router();
const autoCallController = require('../controllers/autoCallController');
const clientAuthMiddleware = require('../../middleware/clientMiddleware');

// Auto-call service endpoints
router.post('/start', clientAuthMiddleware, autoCallController.startAutoCallService);
router.post('/stop', clientAuthMiddleware, autoCallController.stopAutoCallService);
router.get('/status', clientAuthMiddleware, autoCallController.getAutoCallServiceStatus);

// 🔴 NEW: Manually process pending leads ONE TIME (for testing and debugging)
router.post('/process-now', clientAuthMiddleware, autoCallController.processOnceNow);

module.exports = router;
