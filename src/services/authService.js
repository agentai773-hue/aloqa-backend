const adminRepository = require('../repositories/adminRepository');
const { generateToken, generateRefreshToken, verifyToken } = require('../utils/jwt');

class AuthService {
  async login(email, password) {
    // Check if admin exists
    const admin = await adminRepository.findByEmail(email);
    if (!admin) {
      throw { status: 401, message: 'Invalid email or password' };
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      throw { status: 401, message: 'Invalid email or password' };
    }

    // Generate tokens
    const tokenPayload = {
      id: admin._id,
      email: admin.email,
      role: admin.role
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token and update last login
    await adminRepository.updateRefreshToken(admin._id, refreshToken);
    await adminRepository.updateLastLogin(admin._id);

    return {
      token,
      refreshToken,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        lastLogin: new Date()
      }
    };
  }

  async refreshToken(token) {
    if (!token) {
      throw { status: 401, message: 'Refresh token is required' };
    }

    // Verify refresh token
    const decoded = verifyToken(token, true);
    
    // Find admin
    const admin = await adminRepository.findById(decoded.id);
    const fullAdmin = await require('../models/Admin').findById(decoded.id);
    
    if (!admin || !fullAdmin || fullAdmin.refreshToken !== token || !fullAdmin.isActive) {
      throw { status: 401, message: 'Invalid refresh token' };
    }

    // Generate new tokens
    const tokenPayload = {
      id: admin._id || admin.id,
      email: admin.email,
      role: admin.role
    };

    const newToken = generateToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    // Update refresh token
    await adminRepository.updateRefreshToken(decoded.id, newRefreshToken);

    return {
      token: newToken,
      refreshToken: newRefreshToken
    };
  }

  async logout(adminId) {
    await adminRepository.removeRefreshToken(adminId);
    return { message: 'Logged out successfully' };
  }
}

module.exports = new AuthService();
