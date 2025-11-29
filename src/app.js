const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/database');

// Import models (to register schemas with MongoDB)
require('./models/Lead');

// Import routes
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 8080;

// Connect to MongoDB
connectDB();

// CORS configuration - MUST come before other middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or same-origin)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',        // Vite dev server (Admin Panel)
      'http://127.0.0.1:5173',        // Alternative localhost
      'http://localhost:3000',         // Next.js dev server (Client Portal)
      'http://127.0.0.1:3000',        // Alternative localhost
      'http://192.168.3.103:3000',    // Network IP
      'http://192.168.2.37:5173',     // Network IP for Admin Panel
      'https://aloqa-admin-panel-frontend.vercel.app', // Vercel deployment
      'http://localhost:8080',
      'http://localhost:8081'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('⚠️  CORS blocked origin:', origin);
      callback(null, true); // Allow in development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Handle preflight requests
app.options('*', cors());

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
})); // Security headers with CORS-friendly config

app.use(cookieParser()); // Parse cookies

// Logging - only in development, minimal output
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // Colored, concise output
} else {
  app.use(morgan('combined')); // Detailed logs for production
}

app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'AI Calling Agent Server is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Access the server at: http://localhost:${PORT}`);
  console.log(`🌐 Network access at: http://192.168.2.37:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  process.exit(0);
});

module.exports = app;