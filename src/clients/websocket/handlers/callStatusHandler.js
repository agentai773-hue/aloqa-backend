/**
 * Call Status Event Handler
 * Handles call-related events like call status updates, lead updates, etc.
 */

class CallStatusHandler {
  /**
   * Register all call status related event handlers
   */
  registerHandlers(socket, io) {
    console.log(`📞 Registering call status handlers for socket: ${socket.id}`);

    // Client can listen for lead_status_changed event
    socket.on('lead:subscribe', (data) => {
      const { leadId } = data;
      if (leadId) {
        const leadRoom = `lead_${leadId}`;
        socket.join(leadRoom);
        console.log(`✅ Socket ${socket.id} subscribed to lead: ${leadRoom}`);
        
        socket.emit('lead:subscribed', {
          leadId,
          message: 'You will receive real-time updates for this lead',
        });
      }
    });

    // Client can unsubscribe from lead updates
    socket.on('lead:unsubscribe', (data) => {
      const { leadId } = data;
      if (leadId) {
        const leadRoom = `lead_${leadId}`;
        socket.leave(leadRoom);
        console.log(`✅ Socket ${socket.id} unsubscribed from lead: ${leadRoom}`);
        
        socket.emit('lead:unsubscribed', {
          leadId,
          message: 'You will no longer receive updates for this lead',
        });
      }
    });

    // Client can request current call status for a lead
    socket.on('call:status_request', async (data) => {
      try {
        const { leadId } = data;
        if (!leadId) {
          socket.emit('error', { message: 'Lead ID is required' });
          return;
        }

        const CallHistory = require('../../../models/CallHistory');
        const callHistory = await CallHistory.findOne({ leadId }).sort({ createdAt: -1 }).lean();

        socket.emit('call:status_response', {
          leadId,
          callHistory,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('❌ Error in call:status_request:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Client acknowledges receipt of real-time update
    socket.on('call:status_ack', (data) => {
      const { leadId, callId, status } = data;
      console.log(`✅ Client acknowledged - Lead: ${leadId}, Call: ${callId}, Status: ${status}`);
    });
  }
}

module.exports = new CallStatusHandler();
