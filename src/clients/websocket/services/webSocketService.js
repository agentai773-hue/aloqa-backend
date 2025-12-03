/**
 * WebSocket Service
 * Provides utilities for broadcasting real-time updates to connected clients
 */

const { getIO } = require('../socketIO');

class WebSocketService {
  /**
   * Emit lead status changed event to specific user and all subscribed clients
   * @param {String} userId - User ID who owns the lead
   * @param {String} leadId - Lead ID
   * @param {Object} leadData - Updated lead data
   * @param {String} eventType - Type of event (call_started, call_completed, status_changed, etc.)
   */
  emitLeadStatusChanged(userId, leadId, leadData, eventType = 'status_changed') {
    try {
      const io = getIO();
      if (!io) {
        console.warn('⚠️  Socket.IO not initialized - cannot emit event');
        return false;
      }

      const userRoom = `user_${userId}`;
      const leadRoom = `lead_${leadId}`;

      const eventData = {
        userId,
        leadId,
        eventType,
        data: leadData,
        timestamp: new Date().toISOString(),
      };

      // Emit to user's room (all their sockets)
      io.to(userRoom).emit('lead:status_changed', eventData);
      
      // Also emit to lead-specific room (for shared viewing)
      io.to(leadRoom).emit('lead:status_changed', eventData);

      console.log(`📡 Broadcasted lead status changed - Lead: ${leadId}, Event: ${eventType}`);
      return true;
    } catch (error) {
      console.error('❌ Error in emitLeadStatusChanged:', error);
      return false;
    }
  }

  /**
   * Emit call started event
   * @param {String} userId - User ID
   * @param {String} leadId - Lead ID
   * @param {Object} callData - Call initialization data
   */
  emitCallStarted(userId, leadId, callData) {
    try {
      const io = getIO();
      if (!io) {
        console.warn('⚠️  Socket.IO not initialized - cannot emit event');
        return false;
      }

      const userRoom = `user_${userId}`;
      const leadRoom = `lead_${leadId}`;

      const eventData = {
        userId,
        leadId,
        type: 'initiated',
        call: callData,
        timestamp: new Date().toISOString(),
      };

      // Broadcast to user's room
      io.to(userRoom).emit('call:started', eventData);
      
      // Broadcast to lead's room
      io.to(leadRoom).emit('call:started', eventData);

      console.log(`📡 Broadcasted call started - Lead: ${leadId}, Call: ${callData?.callId}`);
      return true;
    } catch (error) {
      console.error('❌ Error in emitCallStarted:', error);
      return false;
    }
  }

  /**
   * Emit call status update event
   * @param {String} userId - User ID
   * @param {String} leadId - Lead ID
   * @param {String} status - Call status (connected, ringing, in-progress, completed, failed, etc.)
   * @param {Object} callDetails - Additional call details
   */
  emitCallStatusUpdate(userId, leadId, status, callDetails = {}) {
    try {
      const io = getIO();
      if (!io) {
        console.warn('⚠️  Socket.IO not initialized - cannot emit event');
        return false;
      }

      const userRoom = `user_${userId}`;
      const leadRoom = `lead_${leadId}`;

      const eventData = {
        userId,
        leadId,
        status,
        callDetails,
        timestamp: new Date().toISOString(),
      };

      // Broadcast to user's room
      io.to(userRoom).emit('call:status_updated', eventData);
      
      // Broadcast to lead's room
      io.to(leadRoom).emit('call:status_updated', eventData);

      console.log(`📡 Broadcasted call status update - Lead: ${leadId}, Status: ${status}`);
      return true;
    } catch (error) {
      console.error('❌ Error in emitCallStatusUpdate:', error);
      return false;
    }
  }

  /**
   * Emit call completed event
   * @param {String} userId - User ID
   * @param {String} leadId - Lead ID
   * @param {Object} callData - Completed call data
   */
  emitCallCompleted(userId, leadId, callData) {
    try {
      const io = getIO();
      if (!io) {
        console.warn('⚠️  Socket.IO not initialized - cannot emit event');
        return false;
      }

      const userRoom = `user_${userId}`;
      const leadRoom = `lead_${leadId}`;

      const eventData = {
        userId,
        leadId,
        type: 'completed',
        call: callData,
        timestamp: new Date().toISOString(),
      };

      // Broadcast to user's room
      io.to(userRoom).emit('call:completed', eventData);
      
      // Broadcast to lead's room
      io.to(leadRoom).emit('call:completed', eventData);

      console.log(`📡 Broadcasted call completed - Lead: ${leadId}, Call: ${callData?.callId}`);
      return true;
    } catch (error) {
      console.error('❌ Error in emitCallCompleted:', error);
      return false;
    }
  }

  /**
   * Emit generic event to user
   * @param {String} userId - User ID
   * @param {String} eventName - Event name
   * @param {Object} data - Event data
   */
  emitToUser(userId, eventName, data) {
    try {
      const io = getIO();
      if (!io) {
        console.warn('⚠️  Socket.IO not initialized - cannot emit event');
        return false;
      }

      const userRoom = `user_${userId}`;
      io.to(userRoom).emit(eventName, data);

      console.log(`📡 Broadcasted event ${eventName} to user ${userId}`);
      return true;
    } catch (error) {
      console.error(`❌ Error in emitToUser for event ${eventName}:`, error);
      return false;
    }
  }

  /**
   * Emit generic event to specific lead
   * @param {String} leadId - Lead ID
   * @param {String} eventName - Event name
   * @param {Object} data - Event data
   */
  emitToLead(leadId, eventName, data) {
    try {
      const io = getIO();
      if (!io) {
        console.warn('⚠️  Socket.IO not initialized - cannot emit event');
        return false;
      }

      const leadRoom = `lead_${leadId}`;
      io.to(leadRoom).emit(eventName, data);

      console.log(`📡 Broadcasted event ${eventName} to lead ${leadId}`);
      return true;
    } catch (error) {
      console.error(`❌ Error in emitToLead for event ${eventName}:`, error);
      return false;
    }
  }

  /**
   * Broadcast event to all connected clients
   * @param {String} eventName - Event name
   * @param {Object} data - Event data
   */
  broadcastToAll(eventName, data) {
    try {
      const io = getIO();
      if (!io) {
        console.warn('⚠️  Socket.IO not initialized - cannot broadcast event');
        return false;
      }

      io.emit(eventName, data);
      console.log(`📡 Broadcasted event ${eventName} to all clients`);
      return true;
    } catch (error) {
      console.error(`❌ Error in broadcastToAll for event ${eventName}:`, error);
      return false;
    }
  }
}

module.exports = new WebSocketService();
