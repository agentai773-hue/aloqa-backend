const express = require('express');
const authRoutes = require('../admin/routes/authRoutes');
const userRoutes = require('../admin/routes/userRoutes');
const assistantRoutes = require('../admin/routes/assistantRoutes');
const phoneNumberRoutes = require('../admin/routes/phoneNumberRoutes');
const verifyEmailRoutes = require('./verifyEmail');
const clientAuthRoutes = require('../clients/routes/authRoutes');
const leadRoutes = require('../clients/routes/leadRoutes');
const clientAssistantRoutes = require('../clients/routes/assistantRoutes');
const clientPhoneNumberRoutes = require('../clients/routes/phoneNumberRoutes');
const assignAssistantPhoneRoutes = require('../clients/routes/assignAssistantPhoneRoutes');
const callRoutes = require('../clients/routes/callRoutes');
const callHistoryRoutes = require('../clients/routes/callHistoryRoutes');
const autoCallRoutes = require('../clients/routes/autoCallRoutes');
const siteVisitRoutes = require('../clients/routes/siteVisitRoutes');
const siteUserRoutes = require('../clients/routes/siteUserRoutes');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Email verification routes (Public)
router.use('/verify-email', verifyEmailRoutes);

// admin routes 

// Authentication routes
router.use('/auth', authRoutes);


// User management routes
router.use('/users', userRoutes);

// Assistant management routes
router.use('/assistants', assistantRoutes);

// Phone number management routes
router.use('/phone-numbers', phoneNumberRoutes);



// user routes

/// clients routes

// Lead management routes
router.use('/leads', leadRoutes);

// Assistant management routes (client)
router.use('/client-assistants', clientAssistantRoutes);

// Phone number management routes (client)
router.use('/client-phone-numbers', clientPhoneNumberRoutes);

// Assign Assistant and Phone routes (client)
router.use('/client-assign-assistant-phone', assignAssistantPhoneRoutes);

// Call routes (client)
router.use('/client-call', callRoutes);

// Call history routes (client)
router.use('/client-call', callHistoryRoutes);

// Auto-call routes (client)
router.use('/client-call', autoCallRoutes);

// Site visit routes (client)
router.use('/client-site-visits', siteVisitRoutes);

// Site user routes (client)
router.use('/client-site-users', siteUserRoutes);

router.use('/client-auth', clientAuthRoutes);


module.exports = router;
