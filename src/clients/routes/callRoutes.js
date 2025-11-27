// clients/routes/callRoutes.js
const express = require('express');
const router = express.Router();
const CallController = require('../controllers/callController');
const clientAuthMiddleware = require('../../middleware/clientMiddleware');

const callController = new CallController();

/**
 * POST /client-call/initiate
 * Initiate a call to a lead
 * Body: { leadId: string }
 * Returns: { success: boolean, message: string, data?: { call_id, status, lead_name, phone_number } }
 */
router.post('/initiate', clientAuthMiddleware, (req, res) =>
  callController.initiateCall(req, res)
);

/**
 * POST /client-call/initiate-custom
 * Initiate a call with custom data (from Make Call form)
 * Body: { customerName: string, projectName: string, recipientPhoneNumber: string, assistantId: string }
 * Returns: { success: boolean, message: string, data?: { call_id, status, customer_name, phone_number } }
 */
router.post('/initiate-custom', clientAuthMiddleware, (req, res) =>
  callController.initiateCustomCall(req, res)
);

module.exports = router;
