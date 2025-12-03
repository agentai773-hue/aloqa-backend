/**
 * Auto Call Service
 * Automatically calls leads with pending status - uses cron job (every 1 hour)
 * Each lead is called only ONCE per day - tracked in database via call_attempt_count
 */

const cron = require('node-cron');
const Lead = require('../../models/Lead');
const CallHistory = require('../../models/CallHistory');
const CallService = require('./callService');
const ScheduledCallsService = require('./scheduledCallsService');
const webSocketService = require('../websocket/services/webSocketService');
const callService = new CallService();
const scheduledCallsService = require('./scheduledCallsService');

class AutoCallService {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
    this.scheduledCallsCron = null;
    // CRITICAL: Lock to prevent concurrent calls to same lead (in-memory set)
    this.leadsBeingCalled = new Set(); // Tracks which lead IDs are currently being called
    this.callInProgress = false; // Flag to prevent concurrent auto-call runs
  }

  /**
   * Start auto-call service with cron job (every 1 hour)
   */
  startAutoCall() {
    if (this.isRunning) {
      return {
        success: true,
        message: 'Auto-call service is already running',
        isRunning: true
      };
    }

    this.isRunning = true;
    console.log('🔄 Starting auto-call service (cron: every 1 hour)');

    // Run at the start of every hour
    this.cronJob = cron.schedule('0 * * * *', async () => {
      try {
        console.log('\n🔵 Auto-call cron triggered at ' + new Date().toISOString());
        await this.processPendingLeads();
      } catch (error) {
        console.error('❌ Error in auto-call cron:', error.message);
      }
    });

    // Also process scheduled calls (runs every 15 minutes)
    this.scheduledCallsCron = cron.schedule('*/15 * * * *', async () => {
      try {
        console.log('📅 Scheduled calls check at ' + new Date().toISOString());
        await scheduledCallsService.processPendingScheduledCalls();
      } catch (error) {
        console.error('❌ Error in scheduled calls cron:', error.message);
      }
    });

    // Reset daily counter at midnight
    this.resetCron = cron.schedule('0 0 * * *', async () => {
      try {
        console.log('🌙 Daily reset at ' + new Date().toISOString());
        await this.resetDailyTracker();
      } catch (error) {
        console.error('❌ Error in reset cron:', error.message);
      }
    });

    console.log('✅ Auto-call cron job started');

    return {
      success: true,
      message: 'Auto-call service started with cron (every 1 hour)',
      isRunning: true
    };
  }

  /**
   * Stop auto-call service
   */
  stopAutoCall() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      this.isRunning = false;
      
      if (this.scheduledCallsCron) {
        this.scheduledCallsCron.stop();
        this.scheduledCallsCron = null;
      }

      if (this.resetCron) {
        this.resetCron.stop();
        this.resetCron = null;
      }

      return {
        success: true,
        message: 'Auto-call service stopped',
        isRunning: false
      };
    }
    return {
      success: false,
      error: 'Auto-call service is not running',
      isRunning: false
    };
  }

  /**
   * Get status of auto-call service
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      message: this.isRunning ? 'Service is running' : 'Service is stopped'
    };
  }

  /**
   * Process all pending leads and call them (runs manually via API)
   * IMPORTANT: Each lead is called ONLY ONCE - regardless of status changes
   * Once has_been_called=true, that lead is NEVER called again
   * 
   * This prevents duplicate calls even if:
   * - Server is restarted
   * - Lead status is reset
   * - Multiple auto-call jobs run
   * 
   * LOCK MECHANISM: Prevents concurrent auto-call runs and concurrent calls to same lead
   */
  async processPendingLeads() {
    try {
      console.log('\n\n████████████████████████████████████████');
      console.log('🔵 AUTO-CALL CYCLE STARTED');
      console.log('████████████████████████████████████████\n');

      // 🔒 PREVENT CONCURRENT AUTO-CALL RUNS
      if (this.callInProgress) {
        console.log('⚠️  Auto-call already in progress. Skipping this run to prevent duplicates.');
        return {
          success: false,
          message: 'Auto-call already in progress. Please wait for current run to complete.'
        };
      }

      this.callInProgress = true;
      console.log(`⏰ AUTO-CALL STARTED AT ${new Date().toISOString()}`);
      console.log(`🔒 callInProgress lock = true`);

      // Get leads that:
      // 1. Have has_been_called = false (NEVER been called before)
      //    NOTE: $ne: true handles both false AND undefined (for old leads)
      // 2. Are not deleted
      // 3. DON'T have an active call in progress
      // IMPORTANT: We ONLY check has_been_called flag. We DON'T check lead_type or call_status
      // because they can change. Only has_been_called is permanent.
      
      // First, get all active calls to avoid calling leads that are already on a call
      const activeCallStatuses = ['initiated', 'queued', 'ringing', 'connected', 'in-progress'];
      const activeCalls = await CallHistory.find({
        status: { $in: activeCallStatuses }
      }).select('leadId').lean();
      
      const activeLeadIds = new Set(activeCalls.map(call => call.leadId?.toString()));
      console.log(`⚠️  ${activeLeadIds.size} leads have active calls - will skip these`);

      const pendingLeads = await Lead.find({
        $or: [
          { has_been_called: false },
          { has_been_called: { $exists: false } }  // For old leads that don't have this field yet
        ],
        deleted_at: null,
        _id: { $nin: Array.from(activeLeadIds) }  // Exclude leads with active calls
      }).lean();

      console.log(`✅ Found ${pendingLeads.length} leads with has_been_called=false and no active calls`);
      
      // 🔴 DEBUG: Log details of pending leads
      if (pendingLeads.length > 0) {
        console.log('🔍 [DEBUG] Pending leads details:');
        for (const lead of pendingLeads) {
          console.log(`  - ${lead.full_name}: has_been_called=${lead.has_been_called}, call_status=${lead.call_status}, lead_type=${lead.lead_type}`);
        }
      }
      
      if (pendingLeads.length === 0) {
        console.log('✅ No leads to call');
        return {
          success: true,
          message: 'No leads to call',
          leadsProcessed: 0
        };
      }

      console.log(`📞 Calling ${pendingLeads.length} leads...`);

      let successCount = 0;
      for (const lead of pendingLeads) {
        const result = await this.callLead(lead);
        if (result.success) {
          successCount++;
          console.log(`✅ ${lead.full_name} - Call initiated`);
        } else {
          console.log(`❌ ${lead.full_name} - ${result.error || 'Failed'}`);
        }
      }

      console.log(`🔵 AUTO-CALL COMPLETED: ${successCount}/${pendingLeads.length} leads called at ${new Date().toISOString()}\n`);
      
      const finalResult = {
        success: true,
        message: `Auto-call completed: ${successCount} leads called`,
        leadsProcessed: successCount
      };

      // 🔒 CLEAR LOCK WHEN DONE
      this.callInProgress = false;
      this.leadsBeingCalled.clear();
      
      return finalResult;
    } catch (error) {
      console.error('❌ CRITICAL ERROR in processPendingLeads:', error.message);
      
      // 🔒 CLEAR LOCK ON ERROR
      this.callInProgress = false;
      this.leadsBeingCalled.clear();
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Call a single lead
   * Double-check has_been_called flag before calling (safety check)
   * Uses per-lead lock to prevent concurrent calls to same lead
   */
  async callLead(lead) {
    try {
      const { _id: leadId, user_id: userId, contact_number, project_name, full_name, has_been_called } = lead;

      // 🔒 PER-LEAD LOCK: Prevent concurrent calls to same lead
      const leadIdStr = leadId.toString();
      if (this.leadsBeingCalled.has(leadIdStr)) {
        console.log(`🔒 SKIPPING ${full_name} - already being called (concurrent call prevention)`);
        return { success: false, error: 'Lead is already being called' };
      }

      // ADD TO LOCK
      this.leadsBeingCalled.add(leadIdStr);
      console.log(`🔒 LOCKED lead ${leadIdStr} for calling`);

      try {
        // 🔴 SAFETY CHECK: If already called, skip (should never happen but prevents duplicates)
        if (has_been_called === true) {
          console.log(`⚠️  SKIPPING ${full_name} - already has has_been_called=true`);
          return { success: false, error: 'Lead already called (safety check)' };
        }

        console.log(`📱 Calling: ${full_name} (${contact_number})`);

        const result = await callService.initiateCall({
          userId: userId,
          leadId: leadId,
          contactNumber: contact_number,
          projectName: project_name,
          isAutoCall: true,
        });

        if (result.success) {
          console.log(`✅ Call initiated: ${full_name}`);

          // Emit WebSocket event - Call Started
          try {
            webSocketService.emitCallStarted(
              userId.toString(),
              leadId.toString(),
              {
                callId: result.callId,
                leadName: full_name,
                phoneNumber: contact_number,
                timestamp: new Date().toISOString(),
              }
            );
            console.log(`📡 WebSocket event emitted - Call started for lead ${full_name}`);
          } catch (wsError) {
            console.warn('⚠️ Error emitting WebSocket event (non-blocking):', wsError.message);
          }

          // Also emit lead status changed event
          try {
            webSocketService.emitLeadStatusChanged(
              userId.toString(),
              leadId.toString(),
              { call_status: 'connected' },
              'call_started'
            );
          } catch (wsError) {
            console.warn('⚠️ Error emitting lead status changed event:', wsError.message);
          }

          return { success: true };
        } else {
          console.error(`❌ Call failed for ${full_name}:`, result.message);
          return { success: false, error: result.message };
        }
      } finally {
        // 🔓 ALWAYS REMOVE LOCK, even if error occurs
        this.leadsBeingCalled.delete(leadIdStr);
        console.log(`🔓 UNLOCKED lead ${leadIdStr}`);
      }
    } catch (error) {
      console.error('❌ Error in callLead:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Reset the daily call counter at midnight
   * NOTE: We NO LONGER reset has_been_called because each lead should only be called ONCE ever
   * This function is kept for backward compatibility but does nothing
   */
  async resetDailyTracker() {
    console.log('⏸️  Daily tracker reset skipped - leads marked has_been_called=true are NEVER called again');
    // Do nothing - leads should only be called once forever
  }
}

module.exports = new AutoCallService();
