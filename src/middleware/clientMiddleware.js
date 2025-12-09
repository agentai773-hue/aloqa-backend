const jwt = require('jsonwebtoken');
const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

const clientAuthMiddleware = async (req, res, next) => {
  try {
    // Debug: Log the request headers and cookies
    console.log('🔍 [Client Auth Debug] Headers:', {
      authorization: req.headers.authorization,
      cookie: req.headers.cookie
    });
    
    // Try Authorization header first, then cookies (cookie-parser used in app)
    let token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token && req.cookies) {
      // common cookie names: token, authToken
      token = req.cookies.token || req.cookies.authToken || null;
      console.log('🔍 [Client Auth Debug] Token from cookies:', !!token);
    }

    if (!token) {
      console.log('❌ [Client Auth Debug] No token found');
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    console.log('🔍 [Client Auth Debug] Token found, verifying...');
    
    // Verify token using JWT utils
    const decoded = verifyToken(token);
    console.log('🔍 [Client Auth Debug] Token decoded successfully:', { userId: decoded.id });
    
    // Find user by id
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      console.log('❌ [Client Auth Debug] User not found for ID:', decoded.id);
      return res.status(401).json({
        success: false,
        message: 'User not found or token is invalid'
      });
    }

    console.log('✅ [Client Auth Debug] User found:', { 
      id: user._id, 
      email: user.email,
      isApproval: user.isApproval,
      isActive: user.isActive 
    });

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
