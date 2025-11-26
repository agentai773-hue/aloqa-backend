// clients/services/authService.js
const bcrypt = require('bcryptjs');
const jwt = require('../../utils/jwt');
const { findUserByEmail } = require('../repositories/authRepository');

async function loginUser(email, password) {
  const user = await findUserByEmail(email);
  
  if (!user) {
    const error = new Error('This email does not exist.');
    error.code = 'INVALID_EMAIL';
    error.statusCode = 401;
    throw error;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    const error = new Error('Please enter a valid email address');
    error.code = 'EMAIL_FORMAT_INVALID';
    error.statusCode = 400;
    throw error;
  }

  // Check if password is correct
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error('Invalid password');
    error.code = 'INVALID_PASSWORD';
    error.statusCode = 401;
    throw error;
  }

  console.log("user",user)
    if (user.isActive !== 1) {
    
    const error = new Error('please check your emmail to verify your account');
    error.code = 'NOT_APPROVED';
    error.statusCode = 403;
    throw error;
  }

  // Check if user is approved (isApproval must be 1)
  if (user.isApproval !== 1) {
    const error = new Error('Your account has not been approved by admin.');
    error.code = 'NOT_APPROVED';
    error.statusCode = 403;
    throw error;
  }

  // Generate JWT token with userId
  const token = jwt.generateToken({ id: user._id, userId: user._id, email: user.email, role: user.role });
  return { token, user };
}


module.exports = { loginUser };