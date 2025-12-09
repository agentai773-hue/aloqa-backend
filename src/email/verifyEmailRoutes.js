const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { sendWelcomeEmail } = require('../utils/emailService');

/**
 * @route   GET /api/verify-email/:token
 * @desc    Verify user email with token
 * @access  Public
 */
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Find user with valid verification token
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() } // Token not expired
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Verification link is invalid or has expired. Please request a new verification email.'
      });
    }

    // Check if already verified
    if (user.isActive === 1) {
      return res.status(200).json({
        success: true,
        message: 'Email already verified. You can login now.',
        alreadyVerified: true
      });
    }

    // Activate user account
    user.isActive = 1;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    // Send welcome email
    try {
      await sendWelcomeEmail(user);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Continue - verification is successful
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! Your account is now active. You can login now.',
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during email verification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/verify-email/resend
 * @desc    Resend verification email
 * @access  Public
 */
router.post('/resend', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    }

    if (user.isActive === 1) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified. You can login now.'
      });
    }

    // Generate new verification token
    const crypto = require('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.verificationToken = verificationToken;
    user.verificationTokenExpires = verificationTokenExpires;
    await user.save();

    // Send verification email
    const { sendVerificationEmail } = require('../utils/emailService');
    await sendVerificationEmail(user, verificationToken);

    res.status(200).json({
      success: true,
      message: 'Verification email has been resent. Please check your inbox.'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
