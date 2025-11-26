// clients/controllers/authController.js
const jwt = require('../../utils/jwt');
const { loginUser } = require('../services/authService');

async function login(req, res) {
  try {
    const { email, password } = req.body;
    console.log("email",email,password)
    const { token, user } = await loginUser(email, password);
    // Set httpOnly cookie so frontend can rely on cookies for auth
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 24 * 60 * 60 * 1000, // 7 days
    };
    res.cookie('token', token, cookieOptions);
    res.json({ token, user });
  } catch (err) {
    const statusCode = err.statusCode || 401;
    res.status(statusCode).json({ 
      message: err.message,
      code: err.code 
    });
  }
}

async function verify(req, res) {
  try {
    // Get token from Authorization header or cookies
    let token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      // Try to get from cookies
      token = req.cookies?.token;
    }
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verifyToken(token);
    res.json({ token, user: decoded });
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = { login, verify };