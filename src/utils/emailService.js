const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Check if email is configured
const isEmailConfigured = () => {
  return !!(
    process.env.EMAIL_HOST &&
    process.env.EMAIL_PORT &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASSWORD
  );
};

// Configure email transporter
const createTransporter = () => {
  if (!isEmailConfigured()) {
    console.warn('⚠️  Email not configured. Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD in .env');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false // Allow self-signed certificates in development
    }
  });
};

// Generate verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Send verification email
const sendVerificationEmail = async (user, verificationToken) => {
  // Check if email is configured - REQUIRED
  if (!isEmailConfigured()) {
    const errorMsg = 'Email configuration missing. Please set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASSWORD in .env file';
    console.error('❌', errorMsg);
    throw new Error(errorMsg);
  }

  try {
    const transporter = createTransporter();
    
    // Frontend URL (update this to your actual client URL)
    const clientURL = process.env.CLIENT_URL
    const verificationLink = `${clientURL}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: `"Aloqa Support" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Verify Your Email - Aloqa Account Created',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #1a1a1a; color: white !important; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .button:hover { background: #333; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .info-box { background: #fff; border-left: 4px solid #1a1a1a; padding: 15px; margin: 20px 0; }
            .warning { color: #d9534f; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Aloqa!</h1>
            </div>
            <div class="content">
              <h2>Hello ${user.firstName} ${user.lastName},</h2>
              <p>Thank you for creating an account with Aloqa. Your account has been successfully created!</p>
              
              <div class="info-box">
                <strong>Account Details:</strong><br>
                Name: ${user.firstName} ${user.lastName}<br>
                Email: ${user.email}<br>
                Company: ${user.companyName}<br>
                User ID: ${user.userId || 'Will be assigned'}
              </div>
              
              <p>To activate your account and start using our services, please verify your email address by clicking the button below:</p>
              
              <div style="text-align: center;">
                <a href="${verificationLink}" class="button">Verify Email Address</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px;">
                ${verificationLink}
              </p>
              
              <div class="info-box">
                <p class="warning">⚠️ Important:</p>
                <ul>
                  <li>This verification link will expire in <strong>24 hours</strong></li>
                  <li>After verification, you can login to your account</li>
                  <li>If you didn't create this account, please ignore this email</li>
                </ul>
              </div>
              
              <p>Once verified, you'll be able to:</p>
              <ul>
                <li>Access your dashboard</li>
                <li>Create and manage AI assistants</li>
                <li>Configure phone numbers</li>
                <li>And much more!</li>
              </ul>
              
              <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
              
              <p>Best regards,<br>
              <strong>The Aloqa Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>&copy; ${new Date().getFullYear()} Aloqa. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hello ${user.firstName} ${user.lastName},

Thank you for creating an account with Aloqa. Your account has been successfully created!

Account Details:
Name: ${user.firstName} ${user.lastName}
Email: ${user.email}
Company: ${user.companyName}
User ID: ${user.userId || 'Will be assigned'}

To activate your account, please verify your email address by clicking the link below:
${verificationLink}

⚠️ Important:
- This verification link will expire in 24 hours
- After verification, you can login to your account
- If you didn't create this account, please ignore this email

Best regards,
The Aloqa Team

---
This is an automated email. Please do not reply to this message.
© ${new Date().getFullYear()} Aloqa. All rights reserved.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send verification email:', error.message);
    console.error('Error details:', error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

// Send welcome email after verification
const sendWelcomeEmail = async (user) => {
  // Check if email is configured - REQUIRED
  if (!isEmailConfigured()) {
    const errorMsg = 'Email configuration missing. Cannot send welcome email.';
    console.error('❌', errorMsg);
    throw new Error(errorMsg);
  }

  try {
    const transporter = createTransporter();
    
    const clientURL = process.env.CLIENT_URL || 'http://localhost:3000';
    const loginLink = `${clientURL}/login`;
    
    const mailOptions = {
      from: `"Aloqa Support" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Account Activated - Welcome to Aloqa!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #1a1a1a; color: white !important; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .success-icon { font-size: 48px; color: #5cb85c; text-align: center; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Account Activated!</h1>
            </div>
            <div class="content">
              <div class="success-icon">✓</div>
              <h2>Welcome, ${user.firstName}!</h2>
              <p>Your email has been successfully verified and your account is now active.</p>
              
              <p>You can now login to your account and start exploring all the features Aloqa has to offer.</p>
              
              <div style="text-align: center;">
                <a href="${loginLink}" class="button">Login to Your Account</a>
              </div>
              
              <p>Happy creating!</p>
              
              <p>Best regards,<br>
              <strong>The Aloqa Team</strong></p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Aloqa. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error.message);
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }
};

module.exports = {
  generateVerificationToken,
  sendVerificationEmail,
  sendWelcomeEmail,
  isEmailConfigured
};
