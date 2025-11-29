const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create transporter for client emails
const createClientTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.CLIENT_EMAIL_HOST,
    port: process.env.CLIENT_EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.CLIENT_EMAIL_USER,
      pass: process.env.CLIENT_EMAIL_PASSWORD
    }
  });
};

// Send OTP email for forgot password
const sendForgotPasswordOTP = async (user, otp) => {
  try {
    const transporter = createClientTransporter();

    const mailOptions = {
      from: `"Aloqa Support" <${process.env.CLIENT_EMAIL_USER}>`,
      to: user.email,
      subject: 'Password Reset OTP - Aloqa AI Calling System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #34DB17 0%, #306B25 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
            .otp-box { 
              background: linear-gradient(135deg, #34DB17 0%, #306B25 100%); 
              color: white; 
              padding: 20px; 
              text-align: center; 
              border-radius: 8px; 
              margin: 25px 0;
              font-size: 28px;
              font-weight: bold;
              letter-spacing: 8px;
              font-family: 'Courier New', monospace;
            }
            .info-box { background: #f9f9f9; border-left: 4px solid #34DB17; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .warning { color: #d9534f; font-weight: bold; }
            .success-icon { font-size: 48px; color: #34DB17; text-align: center; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .button { display: inline-block; background: linear-gradient(135deg, #34DB17 0%, #306B25 100%); color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            h2 { color: #306B25; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <div class="success-icon">✓</div>
              <h2>Hello ${user.firstName} ${user.lastName},</h2>
              <p>We received a request to reset the password for your Aloqa account. Use the OTP below to proceed with resetting your password.</p>
              
              <p style="margin: 20px 0;"><strong>Your One-Time Password (OTP):</strong></p>
              <div class="otp-box">${otp}</div>
              
              <div class="info-box">
                <strong>Account Email:</strong><br>
                ${user.email}
              </div>
              
              <div class="info-box">
                <p class="warning">⚠️ Important Security Notice:</p>
                <ul style="margin: 10px 0;">
                  <li>This OTP will expire in <strong>10 minutes</strong></li>
                  <li>Never share this OTP with anyone</li>
                  <li>Aloqa support will never ask for your OTP</li>
                  <li>If you didn't request a password reset, you can safely ignore this email</li>
                </ul>
              </div>
              
              <p><strong>Steps to reset your password:</strong></p>
              <ol style="margin: 15px 0;">
                <li>Copy the OTP above</li>
                <li>Go to the password reset page on Aloqa</li>
                <li>Enter the OTP along with your new password</li>
                <li>Confirm your new password</li>
              </ol>
              
              <p>If you have any questions or need further assistance, please contact our support team.</p>
              
              <p>Best regards,<br>
              <strong style="color: #34DB17;">The Aloqa Team</strong></p>
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

We received a request to reset the password for your Aloqa account. Use the OTP below to proceed with resetting your password.

Your One-Time Password (OTP): ${otp}

Account Email: ${user.email}

⚠️ Important Security Notice:
- This OTP will expire in 10 minutes
- Never share this OTP with anyone
- Aloqa support will never ask for your OTP
- If you didn't request a password reset, you can safely ignore this email

Steps to reset your password:
1. Copy the OTP above
2. Go to the password reset page on Aloqa
3. Enter the OTP along with your new password
4. Confirm your new password

Best regards,
The Aloqa Team

---
This is an automated email. Please do not reply to this message.
© ${new Date().getFullYear()} Aloqa. All rights reserved.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Forgot password OTP email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending forgot password OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};

// Send password reset confirmation email
const sendPasswordResetConfirmation = async (user) => {
  try {
    const transporter = createClientTransporter();

    const mailOptions = {
      from: `"Aloqa Support" <${process.env.CLIENT_EMAIL_USER}>`,
      to: user.email,
      subject: 'Password Reset Successful - Aloqa AI Calling System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #34DB17 0%, #306B25 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
            .success-icon { font-size: 48px; color: #34DB17; text-align: center; margin: 20px 0; }
            .info-box { background: #f9f9f9; border-left: 4px solid #34DB17; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .button { display: inline-block; background: linear-gradient(135deg, #34DB17 0%, #306B25 100%); color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            h2 { color: #306B25; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Password Reset Successful</h1>
            </div>
            <div class="content">
              <div class="success-icon">✓</div>
              <h2>Password Reset Confirmation</h2>
              <p>Your password has been successfully reset. You can now login to your Aloqa account with your new password.</p>
              
              <div class="info-box">
                <strong>Important:</strong><br>
                If you didn't reset your password, please contact our support team immediately at ${process.env.CLIENT_EMAIL_USER}
              </div>
              
              <div style="text-align: center;">
                <a href="${process.env.CLIENT_URL1}/login" class="button">Login to Your Account</a>
              </div>
              
              <p>Thank you for using Aloqa!</p>
              
              <p>Best regards,<br>
              <strong style="color: #34DB17;">The Aloqa Team</strong></p>
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
    console.log('Password reset confirmation email sent to:', user.email);
  } catch (error) {
    console.error('Error sending password reset confirmation email:', error);
    // Don't throw error - confirmation email is not critical
  }
};

module.exports = {
  generateOTP,
  sendForgotPasswordOTP,
  sendPasswordResetConfirmation
};
