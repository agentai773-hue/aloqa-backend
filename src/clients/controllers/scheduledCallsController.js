/**
 * Scheduled Calls Controller
 * Handles scheduled call operations
 */

const scheduledCallsService = require('../services/scheduledCallsService');

class ScheduledCallsController {
  /**
   * Get scheduled call for a lead
   */
  async getScheduledCall(req, res) {
    try {
      const { leadId } = req.params;
      const userId = req.user._id;

      if (!leadId) {
        return res.status(400).json({
          success: false,
          message: 'Lead ID is required',
        });
      }

      const result = await scheduledCallsService.getScheduledCallsForLead(leadId);

      if (!result.success) {
        return res.status(500).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('❌ Error in getScheduledCall:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch scheduled call',
      });
    }
  }

  /**
   * Reschedule a call
   */
  async rescheduleCall(req, res) {
    try {
      const { leadId } = req.params;
      const { scheduledTime, reason } = req.body;
      const userId = req.user._id;

      if (!leadId || !scheduledTime) {
        return res.status(400).json({
          success: false,
          message: 'Lead ID and scheduled time are required',
        });
      }

      const result = await scheduledCallsService.rescheduleCall(
        leadId,
        new Date(scheduledTime),
        reason
      );

      if (!result.success) {
        return res.status(500).json(result);
      }

      // Emit WebSocket event
      const io = req.app.locals.io;
      if (io) {
        io.to(`user:${userId}`).emit('call:rescheduled', {
          leadId: leadId,
          scheduledTime: new Date(scheduledTime),
          reason: reason,
          timestamp: new Date()
        });
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('❌ Error in rescheduleCall:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to reschedule call',
      });
    }
  }

  /**
   * Cancel scheduled call
   */
  async cancelScheduledCall(req, res) {
    try {
      const { leadId } = req.params;
      const userId = req.user._id;

      if (!leadId) {
        return res.status(400).json({
          success: false,
          message: 'Lead ID is required',
        });
      }

      const result = await scheduledCallsService.cancelScheduledCall(leadId);

      if (!result.success) {
        return res.status(500).json(result);
      }

      // Emit WebSocket event
      const io = req.app.locals.io;
      if (io) {
        io.to(`user:${userId}`).emit('call:cancelled', {
          leadId: leadId,
          timestamp: new Date()
        });
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('❌ Error in cancelScheduledCall:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to cancel scheduled call',
      });
    }
  }
}

module.exports = new ScheduledCallsController();
