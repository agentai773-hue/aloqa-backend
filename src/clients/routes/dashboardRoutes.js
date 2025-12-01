const express = require('express');
const DashboardController = require('../controllers/dashboardController');
const clientAuthMiddleware = require('../../middleware/clientMiddleware');

const router = express.Router();
const dashboardController = new DashboardController();

/**
 * Get complete dashboard statistics
 * GET /api/client-dashboard
 * Returns: All counts (leads, call history, assistants, total minutes) in one response
 */
router.get('/', clientAuthMiddleware, (req, res) =>
  dashboardController.getDashboardStats(req, res)
);

module.exports = router;
