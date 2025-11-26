const jwt = require('jsonwebtoken');
const User = require('../models/User');

const clientAuthMiddleware = async (req, res, next) => {
  try {
    // Try Authorization header first, then cookies (cookie-parser used in app)
    let token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token && req.cookies) {
      // common cookie names: token, authToken
      token = req.cookies.token || req.cookies.authToken || null;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Find user by id
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found or token is invalid'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Client auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

module.exports = clientAuthMiddleware;
