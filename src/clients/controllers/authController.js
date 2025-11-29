// clients/controllers/authController.js
const jwt = require('../../utils/jwt');
const User = require('../../models/User');
const { loginUser } = require('../services/authService');
const { generateOTP, sendForgotPasswordOTP, sendPasswordResetConfirmation } = require('../../utils/clientEmailService');
const bcrypt = require('bcryptjs');

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const { token, user } = await loginUser(email, password);
    // Set cookie that can be managed by frontend for logout
    const cookieOptions = {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 24 * 60 * 60 * 1000, // 10 days
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

async function logout(req, res) {
  try {
    res.clearCookie('token', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Logout failed' });
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
    
    // Fetch user from database to get bearerToken
    const user = await User.findById(decoded.id).select(
      'firstName lastName email mobile companyName role bearerToken isApproval'
    );
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Create response object with bearerToken
    const userResponse = {
      ...decoded,
      bearerToken: user.bearerToken
    };

    res.json({ token, user: userResponse });
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Request password reset - send OTP to email
async function requestPasswordReset(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase(), isActive: 1 });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found with this email' 
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

    // Save OTP and expiration to user
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP email
    await sendForgotPasswordOTP(user, otp);

    res.json({ 
      success: true, 
      message: 'OTP sent to your email address',
      email: user.email 
    });
  } catch (err) {
    console.error('Error in requestPasswordReset:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Failed to send OTP' 
    });
  }
}

// Reset password with OTP
async function resetPasswordWithOTP(req, res) {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    // Validation
    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, OTP, and passwords are required' 
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Passwords do not match' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check OTP validity
    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP' 
      });
    }

    // Check OTP expiration
    if (new Date() > user.otpExpires) {
      return res.status(400).json({ 
        success: false, 
        message: 'OTP has expired. Please request a new one' 
      });
    }

    // Update password
    user.password = newPassword;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    // Send confirmation email
    await sendPasswordResetConfirmation(user);

    res.json({ 
      success: true, 
      message: 'Password reset successful. You can now login with your new password.' 
    });
  } catch (err) {
    console.error('Error in resetPasswordWithOTP:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Failed to reset password' 
    });
  }
}

module.exports = { login, verify, logout, requestPasswordReset, resetPasswordWithOTP };