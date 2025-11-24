const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (payload, expiresIn = '24h') => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn,
  });
};

// Generate refresh token
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret', {
    expiresIn: '7d',
  });
};

// Verify JWT token
const verifyToken = (token, isRefreshToken = false) => {
  const secret = isRefreshToken 
    ? process.env.JWT_REFRESH_SECRET || 'your-refresh-secret'
    : process.env.JWT_SECRET || 'your-secret-key';
    
  return jwt.verify(token, secret);
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken
};