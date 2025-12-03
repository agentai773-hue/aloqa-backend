const express = require('express');
const router = express.Router();
const scheduledCallsController = require('../controllers/scheduledCallsController');
const clientAuthMiddleware = require('../../middleware/clientMiddleware');

// Protected routes - require authentication
router.get('/scheduled-call/:leadId', clientAuthMiddleware, scheduledCallsController.getScheduledCall);
router.post('/scheduled-call/:leadId/reschedule', clientAuthMiddleware, scheduledCallsController.rescheduleCall);
router.post('/scheduled-call/:leadId/cancel', clientAuthMiddleware, scheduledCallsController.cancelScheduledCall);

module.exports = router;
