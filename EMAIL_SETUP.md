# 📧 Email Configuration Guide

## Quick Setup

Add these to your `.env` file:

```bash
# Email Configuration (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
```

## Option 1: Gmail (Recommended for Development)

### Step 1: Enable 2-Factor Authentication
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification

### Step 2: Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Enter "Aloqa Backend"
4. Copy the 16-character password

### Step 3: Update .env
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # 16-char app password
```

## Option 2: Other Email Providers

### SendGrid
```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

### Mailgun
```bash
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=postmaster@your-domain.mailgun.org
EMAIL_PASSWORD=your-mailgun-password
```

### AWS SES
```bash
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=your-aws-smtp-username
EMAIL_PASSWORD=your-aws-smtp-password
```

## Testing Email

After configuration, restart the backend and create a test user.

## Skip Email (Development Only)

If you want to skip email verification during development:
- User account will be created successfully
- Email sending will be skipped with a warning
- Check console logs for verification token

## Troubleshooting

### "Missing credentials for PLAIN"
- EMAIL credentials not set in .env file
- Solution: Add EMAIL_* variables

### "Invalid login"
- Wrong username/password
- For Gmail: Use App Password, not regular password

### "Connection timeout"
- Firewall blocking SMTP port
- Wrong EMAIL_HOST or EMAIL_PORT

### SSL/TLS errors
- Try port 465 (SSL) or 587 (TLS)
- Set secure: true for port 465
