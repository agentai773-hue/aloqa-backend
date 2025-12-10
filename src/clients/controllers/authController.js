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
    
    // Set cookie with environment-specific settings
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction, // HTTPS only in production
      sameSite: isProduction ? 'none' : 'lax', // Use 'none' for HTTPS cross-origin
      maxAge: 10 * 24 * 60 * 60 * 1000, // 10 days
      path: '/', // Available across all paths
    };
    
    res.cookie('token', token, cookieOptions);
    
    res.status(200).json({ 
      success: true,
      token, 
      user,
      message: 'Login successful'
    });
  } catch (err) {
    const statusCode = err.statusCode || 401;
    console.error('❌ Login failed:', err.message);
    res.status(statusCode).json({ 
      success: false,
      message: err.message,
      code: err.code 
    });
  }
}

async function logout(req, res) {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    // Clear the token cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
    });
    
    res.status(200).json({ 
      success: true,
      message: 'Logged out successfully' 
    });
  } catch (err) {
    console.error('❌ Logout failed:', err.message);
    res.status(500).json({ 
      success: false,
      message: 'Logout failed' 
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
      return res.status(401).json({ 
        success: false,
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verifyToken(token);
    
    // Fetch user from database to get all required fields
    const user = await User.findById(decoded.id).select(
      'firstName lastName email mobile companyName role bearerToken isApproval isActive'
    );
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Check if user is still active and approved
    if (user.isActive !== 1) {
      return res.status(403).json({
        success: false,
        message: 'User account is not active'
      });
    }

    if (user.isApproval !== 1) {
      return res.status(403).json({
        success: false,
        message: 'User account is not approved'
      });
    }

    // Create response object with all required fields
    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      mobile: user.mobile,
      companyName: user.companyName,
      role: user.role,
      isApproval: user.isApproval,
      bearerToken: user.bearerToken
    };

    res.status(200).json({ 
      success: true,
      token, 
      user: userResponse 
    });
  } catch (err) {
    console.error('❌ Token verification failed:', err.message);
    res.status(401).json({ 
      success: false,
      message: 'Invalid or expired token' 
    });
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

    // Check if new password is same as old password
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password cannot be the same as your previous password' 
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