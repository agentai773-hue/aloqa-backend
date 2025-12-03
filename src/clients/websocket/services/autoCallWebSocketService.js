/**
 * Auto-Call WebSocket Service
 * Listens for leads:fetched event and automatically calls pending leads
 * Uses WebSocket to trigger calls instead of cron jobs
 * Ensures each lead is called ONLY ONCE via has_been_called flag
 */

const Lead = require('../../../models/Lead');
const CallHistory = require('../../../models/CallHistory');
const CallService = require('../../services/callService');
const webSocketService = require('./webSocketService');

const callService = new CallService();

class AutoCallWebSocketService {
  constructor() {
    this.leadsBeingCalled = new Set();
    this.callInProgress = false;
    this.usersWithActiveAutoCall = new Set();
  }

  /**
   * Register WebSocket event listeners on user socket
   * Called when user connects via WebSocket
   */
  registerAutoCallListeners(socket, userId) {
    console.log(`📞 Registering auto-call listeners for socket ${socket.id}, user ${userId}`);

    // When leads are fetched and displayed to user
    socket.on('leads:fetched', async (data) => {
      try {
        console.log(`\n📡 [WebSocket Event] leads:fetched received for user ${userId}`);
        console.log(`📊 Leads count: ${data?.leads?.length || 0}`);

        const leads = data?.leads || [];
        if (!leads || leads.length === 0) {
          console.log('✅ No leads to process');
          return;
        }

        // Start auto-call for this user if not already running
        await this.processLeadsForAutoCall(userId, leads);
      } catch (error) {
        console.error('❌ Error in leads:fetched handler:', error.message);
      }
    });

    console.log(`✅ Auto-call listeners registered for user ${userId}`);
  }

  /**
   * Process leads for auto-call when they arrive
   * Each lead is called ONLY ONCE (checked via has_been_called flag)
   */
  async processLeadsForAutoCall(userId, leads) {
    try {
      // Prevent concurrent auto-call for same user
      if (this.usersWithActiveAutoCall.has(userId)) {
        console.log(`⚠️  Auto-call already in progress for user ${userId}. Skipping.`);
        return;
      }

      this.usersWithActiveAutoCall.add(userId);
      console.log(`🔒 Locked auto-call for user ${userId}`);

      try {
        console.log(`\n████████████████████████████████████████`);
        console.log(`🔵 AUTO-CALL STARTED FOR PENDING LEADS`);
        console.log(`████████████████████████████████████████\n`);

        // Filter leads that:
        // 1. Have NOT been called before (has_been_called = false or undefined)
        // 2. Have call_status = 'pending'
        // 3. Are not already on an active call
        const pendingLeads = leads.filter(lead => {
          const hasBeenCalled = lead.has_been_called === true;
          const isPending = lead.call_status === 'pending';

          if (hasBeenCalled) {
            console.log(`⏭️  Skipping ${lead.full_name} - already called (has_been_called=true)`);
          }

          return !hasBeenCalled && isPending;
        });

        console.log(`✅ Found ${pendingLeads.length} pending leads to call`);

        if (pendingLeads.length === 0) {
          console.log('✅ All leads have been called or are not pending');
          return;
        }

        // Call each pending lead
        let successCount = 0;
        for (const lead of pendingLeads) {
          const result = await this.callLeadViaWebSocket(lead, userId);
          if (result.success) {
            successCount++;
            console.log(`✅ ${lead.full_name} - Call initiated`);
          } else {
            console.log(`❌ ${lead.full_name} - ${result.error || 'Failed'}`);
          }
        }

        console.log(`\n████████████████████████████████████████`);
        console.log(`🔵 AUTO-CALL COMPLETED: ${successCount}/${pendingLeads.length} leads called`);
        console.log(`████████████████████████████████████████\n`);
      } finally {
        // Release lock
        this.usersWithActiveAutoCall.delete(userId);
        console.log(`🔓 Unlocked auto-call for user ${userId}`);
      }
    } catch (error) {
      console.error('❌ Error in processLeadsForAutoCall:', error.message);
      this.usersWithActiveAutoCall.delete(userId);
    }
  }

  /**
   * Call a single lead via WebSocket
   * Double-checks has_been_called before initiating call
   */
  async callLeadViaWebSocket(lead, userId) {
    try {
      const leadIdStr = lead._id.toString();

      // Per-lead lock: prevent concurrent calls to same lead
      if (this.leadsBeingCalled.has(leadIdStr)) {
        console.log(`🔒 SKIPPING ${lead.full_name} - already being called`);
        return { success: false, error: 'Lead is already being called' };
      }

      this.leadsBeingCalled.add(leadIdStr);
      console.log(`🔒 LOCKED lead ${leadIdStr} for calling`);

      try {
        // Safety check: verify lead hasn't been called already
        const freshLead = await Lead.findById(lead._id);
        if (freshLead?.has_been_called === true) {
          console.log(`⚠️  SKIPPING ${lead.full_name} - already marked as called (safety check)`);
          return { success: false, error: 'Lead already called' };
        }

        console.log(`📱 Calling: ${lead.full_name} (${lead.contact_number})`);

        // Initiate the call
        const result = await callService.initiateCall({
          userId: lead.user_id || userId,
          leadId: lead._id,
          isAutoCall: true,
          autoCallAttemptNumber: 1,
        });

        if (result.success) {
          console.log(`✅ Call initiated successfully for ${lead.full_name}`);
          // Note: callService.initiateCall() already emits WebSocket events
          // So we don't need to emit again here - avoid duplicate emissions
          return { success: true };
        } else {
          console.error(`❌ Call failed for ${lead.full_name}:`, result.message);
          return { success: false, error: result.message };
        }
      } finally {
        // Release per-lead lock
        this.leadsBeingCalled.delete(leadIdStr);
        console.log(`🔓 UNLOCKED lead ${leadIdStr}`);
      }
    } catch (error) {
      console.error('❌ Error in callLeadViaWebSocket:', error.message);
      this.leadsBeingCalled.delete(lead._id.toString());
      return { success: false, error: error.message };
    }
  }
}

module.exports = new AutoCallWebSocketService();
