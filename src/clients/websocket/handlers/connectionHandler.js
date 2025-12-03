/**
 * Socket Connection Handler
 * Manages socket lifecycle events: connection, disconnection, and room management
 */

const autoCallWebSocketService = require('../services/autoCallWebSocketService');

class ConnectionHandler {
  /**
   * Handle new socket connection
   */
  handleConnection(socket, io) {
    console.log(`📡 Connection handler - Setting up socket: ${socket.id}`);

    // Join user-specific room for targeted broadcasts
    // Format: user_<userId>
    const userRoom = `user_${socket.userId}`;
    socket.join(userRoom);
    console.log(`✅ Socket ${socket.id} joined room: ${userRoom}`);

    // Register auto-call WebSocket listeners
    autoCallWebSocketService.registerAutoCallListeners(socket, socket.userId);

    // Emit connection success event
    socket.emit('connected', {
      socketId: socket.id,
      userId: socket.userId,
      timestamp: new Date().toISOString(),
    });

    // Send current active connections count
    const totalSockets = io.sockets.sockets.size;
    console.log(`👥 Active connections: ${totalSockets}`);

    socket.emit('stats:active_connections', {
      count: totalSockets,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle socket disconnection
   */
  handleDisconnection(socket, io) {
    console.log(`🔌 Disconnection handler - Socket: ${socket.id}, User: ${socket.userId}`);

    const userRoom = `user_${socket.userId}`;
    socket.leave(userRoom);

    // Count actual Socket.IO connections (not HTTP engine connections)
    const totalSockets = io.sockets.sockets.size;
    console.log(`👥 Active connections after disconnect: ${totalSockets}`);
  }

  /**
   * Get all connected sockets for a specific user
   */
  static getSocketsByUserId(io, userId) {
    const userRoom = `user_${userId}`;
    const sockets = io.sockets.adapter.rooms.get(userRoom);
    return sockets ? Array.from(sockets) : [];
  }

  /**
   * Check if a user is connected
   */
  static isUserConnected(io, userId) {
    return this.getSocketsByUserId(io, userId).length > 0;
  }
}

module.exports = new ConnectionHandler();
