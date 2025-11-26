const express = require('express');
const router = express.Router();
const { login, verify, logout } = require('../controllers/authController');
const { clientLoginValidation, handleValidationErrors } = require('../../validators/authClientValidation');
const clientAuthMiddleware = require('../../middleware/clientMiddleware');

// Client login route
router.post('/login', clientLoginValidation, handleValidationErrors, (req, res, next) =>
  login(req, res, next)
);

// Client verify route
router.post('/verify', (req, res) =>
  verify(req, res)
);

// Client logout route (requires authentication)
router.post('/logout', clientAuthMiddleware, (req, res) =>
  logout(req, res)
);

module.exports = router;