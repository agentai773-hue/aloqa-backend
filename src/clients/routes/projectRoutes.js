const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { createProjectValidation, updateProjectValidation } = require('../validators/projectValidator');
const clientAuthMiddleware = require('../../middleware/clientMiddleware');
const { validationResult } = require('express-validator');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Apply authentication to all routes
router.use(clientAuthMiddleware);

// GET /client/projects - Get all projects with pagination, search, and filters
router.get('/', (req, res) => projectController.getAllProjects(req, res));

// GET /client/projects/stats - Get project statistics
router.get('/stats', (req, res) => projectController.getProjectStats(req, res));

// GET /client/projects/:id - Get specific project
router.get('/:id', (req, res) => projectController.getProject(req, res));

// POST /client/projects - Create new project
router.post('/', createProjectValidation, handleValidationErrors, (req, res) => 
  projectController.createProject(req, res)
);

// PUT /client/projects/:id - Update project
router.put('/:id', updateProjectValidation, handleValidationErrors, (req, res) => 
  projectController.updateProject(req, res)
);

// DELETE /client/projects/:id - Delete project
router.delete('/:id', (req, res) => projectController.deleteProject(req, res));

module.exports = router;

module.exports = router;