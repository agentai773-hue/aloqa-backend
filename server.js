const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const socketIO = require('socket.io');
require('dotenv').config();

// Import database connection
const connectDB = require('./src/config/database');

// Import routes
const routes = require('./src/routes');

// Import cron jobs initializer
const CronJobsInitializer = require('./src/config/cronJobsInitializer');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://192.168.2.37:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:8080',
      'http://localhost:8081',
      process.env.CLIENT_URL,
      process.env.CLIENT_URL1
    ].filter(Boolean),
    credentials: true
  }
});

const PORT = process.env.PORT || 8080;

// Make io accessible to routes and services
app.locals.io = io;

// Connect to MongoDB
connectDB();

// Initialize cron jobs
CronJobsInitializer.initializeCronJobs();

// CORS configuration - MUST come before other middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or same-origin)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',        // Vite dev server (Admin Panel)
      'http://127.0.0.1:5173',        // Alternative localhost
      'http://192.168.2.37:5173',    // Network IP
      'http://localhost:3000',         // Next.js dev server (Client Portal)
      'http://127.0.0.1:3000',        // Alternative localhost
      'http://localhost:8080',         // Alternative frontend port
      'http://localhost:8081',         // Alternative frontend port
      process.env.CLIENT_URL,
      process.env.CLIENT_URL1
    ].filter(Boolean);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('⚠️  CORS blocked origin:', origin);
      callback(null, true); // Allow in development - change to false in production
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400, // 24 hours
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

app.use(morgan('combined')); // Logging
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
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Access the server at: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket.io initialized`);
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`✅ WebSocket: New client connected ${socket.id}`);

  socket.on('join-user', (userId) => {
    if (!userId) {
      console.warn('⚠️  WebSocket: join-user event received with no userId');
      return;
    }
    socket.join(`user:${userId}`);
    console.log(`✅ WebSocket: User ${userId} joined room user:${userId}`);
    
    // Emit acknowledgement back to client
    socket.emit('joined-user-room', { userId, roomName: `user:${userId}` });
  });

  socket.on('disconnect', () => {
    console.log(`❌ WebSocket: Client disconnected ${socket.id}`);
  });

  socket.on('error', (error) => {
    console.error(`❌ WebSocket: Client error ${socket.id}:`, error);
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  CronJobsInitializer.stopAllCronJobs();
  server.close(() => {
    process.exit(0);
  });
});

module.exports = app;