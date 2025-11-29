# Forgot Password Feature - Quick Setup Guide

## 🚀 Quick Start

This guide will help you set up the forgot password feature in 5 minutes.

## ✅ What's Been Implemented

### Backend
- ✅ Email service for sending OTPs (`clientEmailService.js`)
- ✅ Two new API routes for forgot password flow
- ✅ OTP generation and validation
- ✅ Email templates (Professional HTML emails)
- ✅ Database integration with User model

### Frontend
- ✅ Email request page (`/forgot-password`)
- ✅ Password reset page with OTP (`/forgot-password/reset`)
- ✅ React Query hooks for API integration
- ✅ Sidebar navigation added
- ✅ Form validation and error handling
- ✅ Loading states and user feedback

---

## 📋 Setup Steps

### Step 1: Backend Environment Configuration

1. **Update your `.env` file** with email credentials:

```bash
# Email Configuration for Client Forgot Password
CLIENT_EMAIL_HOST=smtp.gmail.com
CLIENT_EMAIL_PORT=587
CLIENT_EMAIL_USER=your-email@gmail.com
CLIENT_EMAIL_PASSWORD=your-app-password

# Frontend URL
CLIENT_URL=http://localhost:3000
```

### Step 2: Gmail Setup (if using Gmail)

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click **Security** in the left menu
3. Enable **2-Step Verification** if not already enabled
4. Go to [App Passwords](https://myaccount.google.com/apppasswords)
5. Select "Mail" and "Windows Computer"
6. Copy the 16-character password Google generates
7. Use this password in `CLIENT_EMAIL_PASSWORD` in your `.env`

### Step 3: Restart Backend Server

```bash
cd d:\Aloqa\aloqa-backend
npm run dev
```

### Step 4: Test the Feature

#### Option A: Using Frontend
1. Start frontend: `npm run dev`
2. Navigate to `/forgot-password`
3. Enter your registered email
4. Check your email for OTP
5. Enter OTP and new password
6. Login with new password

#### Option B: Using cURL
```bash
# Step 1: Request OTP
curl -X POST http://localhost:8080/auth/forgot-password/request \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com"}'

# Step 2: Reset Password (use OTP from email)
curl -X POST http://localhost:8080/auth/forgot-password/reset \
  -H "Content-Type: application/json" \
  -d '{
    "email":"your-email@gmail.com",
    "otp":"123456",
    "newPassword":"NewPassword123",
    "confirmPassword":"NewPassword123"
  }'
```

---

## 📁 File Structure

```
Backend:
├── src/
│   ├── utils/
│   │   └── clientEmailService.js (NEW) - Email sending logic
│   ├── clients/
│   │   ├── controllers/
│   │   │   └── authController.js (MODIFIED) - Added forgot password endpoints
│   │   └── routes/
│   │       └── authRoutes.js (MODIFIED) - Added routes
│   └── models/
│       └── User.js (already has otp, otpExpires fields)

Frontend:
├── src/
│   ├── api/
│   │   └── forgot-password.ts (NEW) - API functions
│   ├── hooks/
│   │   └── useForgotPassword.ts (NEW) - React Query hooks
│   ├── app/(dashboard)/
│   │   └── forgot-password/
│   │       ├── page.tsx (NEW) - Email request page
│   │       └── reset/page.tsx (NEW) - Password reset page
│   └── components/layout/
│       └── Sidebar.tsx (MODIFIED) - Added forgot password link
```

---

## 🔐 Security Features

- ✅ OTP expires after 10 minutes
- ✅ Passwords are hashed with bcryptjs (cost 12)
- ✅ Email verification required
- ✅ Comprehensive input validation
- ✅ Confirmation emails sent
- ✅ Secure cookie handling

---

## 📧 Email Configuration Examples

### Gmail (Recommended)
```bash
CLIENT_EMAIL_HOST=smtp.gmail.com
CLIENT_EMAIL_PORT=587
CLIENT_EMAIL_USER=your-email@gmail.com
CLIENT_EMAIL_PASSWORD=your-app-password
```

### Outlook
```bash
CLIENT_EMAIL_HOST=smtp.office365.com
CLIENT_EMAIL_PORT=587
CLIENT_EMAIL_USER=your-email@outlook.com
CLIENT_EMAIL_PASSWORD=your-password
```

### Custom SMTP
```bash
CLIENT_EMAIL_HOST=smtp.your-provider.com
CLIENT_EMAIL_PORT=587
CLIENT_EMAIL_USER=your-email@provider.com
CLIENT_EMAIL_PASSWORD=your-password
```

---

## 🧪 Testing Checklist

- [ ] OTP is received in email
- [ ] OTP validates correctly
- [ ] Invalid OTP shows error
- [ ] OTP expires after 10 minutes
- [ ] Passwords must match
- [ ] Password minimum 6 characters
- [ ] User can login with new password
- [ ] Confirmation email is sent
- [ ] Email can be checked for typos
- [ ] Sidebar link works

---

## 🐛 Troubleshooting

### Issue: Emails not being sent
**Solution:**
1. Check `.env` file for correct email credentials
2. If using Gmail, ensure you're using an app-specific password
3. Check firewall/network allowing port 587
4. Enable "Less secure app access" for non-Gmail accounts

### Issue: OTP page not loading
**Solution:**
1. Ensure email is in URL: `/forgot-password/reset?email=user@example.com`
2. Clear browser cache and reload

### Issue: "User not found" error
**Solution:**
1. Check if user is actually registered
2. Verify email spelling
3. Ensure user account is active (isActive: 1)

### Issue: "OTP expired" error
**Solution:**
1. Request new OTP from `/forgot-password` page
2. OTP valid for 10 minutes only

---

## 📞 User Support

Share these steps with users:

1. **Forgot password?** Go to login page → Click "Forgot Password"
2. **Enter your email** - The email you used to register
3. **Check your email** - Look for OTP (check spam folder)
4. **Enter OTP** - From the email you received
5. **Create new password** - Min 6 characters
6. **Login** - Use new password to login

---

## 🎯 API Endpoints

### Request OTP
```
POST /auth/forgot-password/request
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Reset Password
```
POST /auth/forgot-password/reset
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```

---

## 📚 Documentation

Full documentation available in: `FORGOT_PASSWORD_DOCUMENTATION.md`

---

## ✨ Features

| Feature | Status | Notes |
|---------|--------|-------|
| Email OTP | ✅ | 6-digit numeric OTP |
| OTP Expiration | ✅ | 10 minutes |
| Password Reset | ✅ | Min 6 characters |
| Email Confirmation | ✅ | Sent after reset |
| Error Handling | ✅ | User-friendly messages |
| Loading States | ✅ | Visual feedback |
| Mobile Responsive | ✅ | Works on all devices |
| Accessibility | ✅ | WCAG compliant |

---

## 🚀 Going Live

Before deploying to production:

1. ✅ Update `CLIENT_URL` to production domain in `.env`
2. ✅ Use production email service credentials
3. ✅ Enable HTTPS for secure cookie transmission
4. ✅ Test complete flow in staging
5. ✅ Implement email rate limiting (optional)
6. ✅ Monitor email delivery logs
7. ✅ Set up error alerts

---

**Ready to test?** Navigate to `/forgot-password` in your application! 🎉
