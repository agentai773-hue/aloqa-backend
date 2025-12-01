const express = require('express');
const router = express.Router();
const callHistoryController = require('../controllers/callHistoryController');
const clientAuthMiddleware = require('../../middleware/clientMiddleware');

// Protected routes - require authentication
router.get('/call-history', clientAuthMiddleware, callHistoryController.getCallHistory);
router.post('/call-history/search', clientAuthMiddleware, callHistoryController.searchCallHistory);
router.get('/call-history/lead/:leadId', clientAuthMiddleware, callHistoryController.getCallHistoryByLead);
router.get('/call-history/recordings', clientAuthMiddleware, callHistoryController.getCallsWithRecordings);
router.get('/call-history/details/:callId', clientAuthMiddleware, callHistoryController.getCallDetails);
router.post('/call-history/check-status/:callId', clientAuthMiddleware, callHistoryController.checkCallStatus);

// Webhook endpoint - public (for Bolna callback)
router.post('/call-history/webhook', callHistoryController.handleCallWebhook);

module.exports = router;
