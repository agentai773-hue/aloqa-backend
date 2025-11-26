const express = require('express');
const router = express.Router();
const { login, verify } = require('../controllers/authController');
const { clientLoginValidation, handleValidationErrors } = require('../../validators/authClientValidation');

// Client login route
router.post('/login', clientLoginValidation, handleValidationErrors, (req, res, next) =>
  login(req, res, next)
);

// Client verify route
router.post('/verify', (req, res) =>
  verify(req, res)
);

module.exports = router;