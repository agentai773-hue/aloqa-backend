/**
 * Scheduled Calls Service
 * Handles calling leads that have scheduled call times
 */

const Lead = require('../../models/Lead');
const CallService = require('./callService');

class ScheduledCallsService {
  constructor() {
    this.callService = new CallService();
  }

  /**
   * Get all scheduled calls for a lead
   */
  async getScheduledCallsForLead(leadId) {
    try {
      const lead = await Lead.findById(leadId);
      
      if (!lead || !lead.scheduled_call_time) {
        return {
          success: true,
          data: null
        };
      }

      return {
        success: true,
        data: {
          leadId: lead._id,
          fullName: lead.full_name,
          scheduledTime: lead.scheduled_call_time,
          reason: lead.scheduled_call_reason,
          status: lead.call_status
        }
      };
    } catch (error) {
      console.error('❌ Error getting scheduled calls:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all leads with past scheduled call times
   */
  async getPendingScheduledCalls() {
    try {
      const now = new Date();
      const leads = await Lead.find({
        scheduled_call_time: { $lte: now },
        call_status: 'scheduled',
        deleted_at: null
      });

      console.log(`📞 Found ${leads.length} leads with pending scheduled calls`);
      return leads;
    } catch (error) {
      console.error('❌ Error fetching pending scheduled calls:', error);
      return [];
    }
  }

  /**
   * Process pending scheduled calls
   */
  async processPendingScheduledCalls() {
    try {
      const leads = await this.getPendingScheduledCalls();

      if (leads.length === 0) {
        return { processed: 0 };
      }

      console.log(`\n📅 Processing ${leads.length} scheduled calls...`);

      let processed = 0;
      for (const lead of leads) {
        await this.callScheduledLead(lead);
        processed++;
      }

      return { processed };
    } catch (error) {
      console.error('❌ Error processing scheduled calls:', error);
      return { processed: 0, error: error.message };
    }
  }

  /**
   * Call a scheduled lead
   */
  async callScheduledLead(lead) {
    try {
      const { _id: leadId, user_id: userId, contact_number, project_name, full_name } = lead;

      console.log(`📱 Calling scheduled lead: ${full_name} (${contact_number})`);

      const result = await this.callService.initiateCall({
        userId: userId,
        leadId: leadId,
        contactNumber: contact_number,
        projectName: project_name,
        isAutoCall: true,
        isScheduledCall: true
      });

      if (result.success) {
        // 🔴 DO NOT reset status back to pending
        // Once a lead is called (scheduled or not), it should NOT be called again
        // The has_been_called flag is set in callService.initiateCall
        // Clear the scheduled call info, but keep call_status as 'connected'
        await Lead.updateOne(
          { _id: leadId },
          {
            scheduled_call_time: null,
            scheduled_call_reason: null
            // NOTE: NOT resetting call_status back to 'pending'
            // Once called, lead stays in 'connected' then 'completed'
          }
        );
        console.log(`✅ Scheduled call initiated: ${full_name} (status NOT reset to pending)`);
      } else {
        console.error(`❌ Scheduled call failed for ${full_name}:`, result.error);
      }
    } catch (error) {
      console.error('❌ Error calling scheduled lead:', error.message);
    }
  }

  /**
   * Reschedule a call (frontend can call this)
   */
  async rescheduleCall(leadId, newScheduledTime, reason) {
    try {
      if (!newScheduledTime) {
        return { success: false, error: 'Scheduled time is required' };
      }

      const lead = await Lead.findByIdAndUpdate(
        leadId,
        {
          scheduled_call_time: newScheduledTime,
          scheduled_call_reason: reason || 'Rescheduled call',
          call_status: 'scheduled'
        },
        { new: true }
      );

      console.log(`📅 Call rescheduled for ${lead.full_name}: ${newScheduledTime}`);

      return {
        success: true,
        data: lead
      };
    } catch (error) {
      console.error('❌ Error rescheduling call:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel scheduled call
   */
  async cancelScheduledCall(leadId) {
    try {
      const lead = await Lead.findByIdAndUpdate(
        leadId,
        {
          scheduled_call_time: null,
          scheduled_call_reason: null,
          call_status: 'pending'
        },
        { new: true }
      );

      console.log(`❌ Call cancelled for ${lead.full_name}`);

      return {
        success: true,
        data: lead
      };
    } catch (error) {
      console.error('❌ Error cancelling scheduled call:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new ScheduledCallsService();
