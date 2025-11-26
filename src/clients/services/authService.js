// clients/services/authService.js
const bcrypt = require('bcryptjs');
const jwt = require('../../utils/jwt');
const { findUserByEmail } = require('../repositories/authRepository');

async function loginUser(email, password) {
  const user = await findUserByEmail(email);
  
  // Check if email exists
  if (!user) {
    const error = new Error('Invalid email');
    error.code = 'INVALID_EMAIL';
    error.statusCode = 401;
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

  // Check if user is approved (isApproval must be 1)
  if (user.isApproval !== 1) {
    const error = new Error('Your account has not been approved by admin. Please contact support.');
    error.code = 'NOT_APPROVED';
    error.statusCode = 403;
    throw error;
  }

  // Generate JWT token with userId
  const token = jwt.generateToken({ id: user._id, userId: user._id, email: user.email, role: user.role });
  return { token, user };
}

module.exports = { loginUser };