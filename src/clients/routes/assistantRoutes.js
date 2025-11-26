// clients/routes/assistantRoutes.js
const express = require('express');
const router = express.Router();
const AssistantController = require('../controllers/assistantController');
const clientAuthMiddleware = require('../../middleware/clientMiddleware');

const assistantController = new AssistantController();

/**
 * GET /assistants
 * Get all assistants for authenticated user
 * Requires: Bearer token in Authorization header
 */
router.get(
  '/',
  clientAuthMiddleware,
  (req, res) => assistantController.getAllAssistants(req, res)
);

/**
 * GET /assistants/:id
 * Get single assistant by ID
 * Requires: Bearer token in Authorization header
 * Params: id - assistant ID
 */
router.get(
  '/:id',
  clientAuthMiddleware,
  (req, res) => assistantController.getAssistantById(req, res)
);

module.exports = router;
