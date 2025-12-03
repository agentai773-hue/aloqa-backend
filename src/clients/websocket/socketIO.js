const { Server } = require('socket.io');
const { verifyToken } = require('../../utils/jwt');

let io = null;

/**
 * Initialize Socket.IO with HTTP server
 * @param {http.Server} httpServer - Express HTTP server instance
 * @param {Object} options - Socket.IO configuration options
 */
function initializeSocketIO(httpServer, options = {}) {
  if (io) {
    console.log('⚠️  Socket.IO already initialized');
    return io;
  }

  io = new Server(httpServer, {
    cors: {
      origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://192.168.3.103:3000',
        'http://192.168.2.37:5173',
        'https://aloqa-admin-panel-frontend.vercel.app',
        'https://aloqa-client-side-frontend.vercel.app',
      ],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket'],
    pingInterval: 25000,
    pingTimeout: 60000,
    maxHttpBufferSize: 1e6,
    ...options,
  });

  // Middleware: Verify JWT token on connection
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication token is required'));
      }

      const decoded = verifyToken(token);
      socket.userId = decoded._id || decoded.id;
      socket.userType = decoded.userType || 'client';
      
      console.log(`✅ Socket authenticated - User: ${socket.userId}, Type: ${socket.userType}`);
      next();
    } catch (error) {
      console.error('❌ Socket authentication failed:', error.message);
      next(new Error('Invalid or expired token'));
    }
  });

  // Register event handlers
  const connectionHandler = require('./handlers/connectionHandler');
  const callStatusHandler = require('./handlers/callStatusHandler');

  // Handle client connections
  io.on('connection', (socket) => {
    console.log(`🔌 New WebSocket connection: ${socket.id} - User: ${socket.userId}`);

    // Register handlers for this socket
    connectionHandler.handleConnection(socket, io);
    callStatusHandler.registerHandlers(socket, io);

    // Handle disconnections
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id} - User: ${socket.userId}`);
      connectionHandler.handleDisconnection(socket, io);
    });

    socket.on('error', (error) => {
      console.error(`❌ Socket error for ${socket.id}:`, error);
    });
  });

  console.log('✅ Socket.IO initialized successfully');
  return io;
}

/**
 * Get Socket.IO instance
 */
function getIO() {
  if (!io) {
    console.warn('⚠️  Socket.IO not initialized. Call initializeSocketIO() first.');
  }
  return io;
}

module.exports = {
  initializeSocketIO,
  getIO,
};
