const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Import database connection
const connectDB = require('./src/config/database');

// Import routes
const routes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 8080;

// ==================== Model Loading ====================
function loadModels() {
  console.log('📦 Loading Models...');
  
  // Admin Models
  require('./src/models/Admin');
  require('./src/models/Assistant');
  require('./src/models/PhoneNumber');
  require('./src/models/AssignUserVoice');
  
  // Client Models  
  require('./src/models/User');
  require('./src/models/Lead');
  require('./src/models/Project');
  
  console.log('✅ All models loaded successfully');
}

// ==================== Startup ====================
console.log('🚀 Initializing Aloqa AI Admin System...');
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔗 Port: ${PORT}`);

// Load models
loadModels();

// Connect to MongoDB
console.log('🔗 Connecting to MongoDB...');
connectDB();

// ==================== CORS Configuration ====================
const allowedOrigins = [
  'http://localhost:5173',        // Admin Panel (Dev)
  'http://127.0.0.1:5173',        
  'https://aloqa-admin-panel-frontend.vercel.app', // Admin Panel (Prod)
  'http://localhost:8080',
  'http://localhost:8081',
  process.env.ADMIN_FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Allow non-browser requests
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400,
  optionsSuccessStatus: 200
}));

// Handle preflight requests
app.options('*', cors());

// ==================== Security & Middleware ====================
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));

app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ==================== Routes ====================
// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Aloqa AI Admin Management System',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    documentation: {
      mainHealth: '/health',
      apiHealth: '/api/health', 
      adminAPI: '/api/admin/*'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api', routes);

// ==================== Error Handling ====================
// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    message: 'The requested endpoint does not exist'
  });
});

// ==================== Server Startup ====================
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🎉 Aloqa AI System Started Successfully!');
  console.log('================================================');
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log('');
  console.log('📋 Available Endpoints:');
  console.log('  🏠 Main Health: /health');
  console.log('  ⚕️  API Health: /api/health');
  console.log('');
  console.log('  🔐 Admin API: /api/admin/*');
  console.log('    ├── Health: /api/admin/health');
  console.log('    ├── Auth: /api/admin/auth');
  console.log('    ├── Users: /api/admin/users');
  console.log('    ├── Assistants: /api/admin/assistants');
  console.log('    ├── Phone Numbers: /api/admin/phone-numbers');
  console.log('    ├── Voices: /api/admin/voices');
  console.log('    └── Assign User Voice: /api/admin/assign-user-voice');
  console.log('');
  console.log('  👤 Client API: /api/client/*');
  console.log('    ├── Auth: /api/client/auth');
  console.log('    ├── Projects: /api/client/projects');
  console.log('    └── Leads: /api/client/leads');
  console.log('');
  console.log('✅ Full system ready!');
  console.log('================================================');
  console.log('');
});

// ==================== Graceful Shutdown ====================
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  console.log('👋 Goodbye!');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

module.exports = app;