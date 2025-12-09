const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistantController');
const clientAuthMiddleware = require('../../middleware/clientMiddleware');

// Apply authentication to all routes
router.use(clientAuthMiddleware);

// GET /client/assistants - Get current user's assistants
router.get('/', (req, res) => assistantController.getUserAssistants(req, res));

module.exports = router;