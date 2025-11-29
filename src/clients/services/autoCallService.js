/**
 * Auto Call Service
 * Automatically calls leads with pending status every 2 minutes
 */

const Lead = require('../../models/Lead');
const CallService = require('./callService');
const callService = new CallService();

class AutoCallService {
  constructor() {
    this.isRunning = false;
    this.pollingInterval = null;
    this.POLL_INTERVAL = 120000; // 2 minutes
  }

  /**
   * Start auto-call service
   */
  startAutoCall() {
    if (this.isRunning) {
      console.log('✅ Auto-call service already running');
      return {
        success: true,
        message: 'Auto-call service is already running',
        isRunning: true
      };
    }

    this.isRunning = true;
    console.log('🔄 Starting auto-call service (every 2 minutes)');

    // Run immediately, then every 2 minutes
    this.processPendingLeads();

    this.pollingInterval = setInterval(() => {
      this.processPendingLeads();
    }, this.POLL_INTERVAL);

    return {
      success: true,
      message: 'Auto-call service started',
      isRunning: true
    };
  }

  /**
   * Stop auto-call service
   */
  stopAutoCall() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.isRunning = false;
      console.log('✋ Stopped auto-call service');
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
   * Process all pending leads and call them
   */
  async processPendingLeads() {
    try {
      const pendingLeads = await Lead.find({
        call_status: 'pending',
        deleted_at: null
      }).lean();

      if (pendingLeads.length === 0) {
        return;
      }

      console.log(`\n📞 Auto-call: Processing ${pendingLeads.length} pending leads...`);

      for (const lead of pendingLeads) {
        await this.callLead(lead);
      }
    } catch (error) {
      console.error('Error in processPendingLeads:', error);
    }
  }

  /**
   * Call a single lead
   */
  async callLead(lead) {
    try {
      const { _id: leadId, user_id: userId, contact_number, project_name, full_name } = lead;

      console.log(`📱 Auto-calling: ${full_name} (${contact_number})`);

      const result = await callService.initiateCall({
        userId: userId,
        leadId: leadId,
        contactNumber: contact_number,
        projectName: project_name,
        isAutoCall: true,
      });

      if (result.success) {
        console.log(`✅ Auto-call initiated: ${full_name}`);
      } else {
        console.error(`❌ Auto-call failed for ${full_name}:`, result.error);
      }
    } catch (error) {
      console.error('Error in callLead:', error.message);
    }
  }
}

module.exports = new AutoCallService();
