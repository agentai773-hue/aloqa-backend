/**
 * Cron Jobs Initialization
 * Setup all background jobs on server startup
 */

const cron = require('node-cron');
const autoCallService = require('../clients/services/autoCallService');
const scheduledCallsService = require('../clients/services/scheduledCallsService');
const leadTypeAutoUpdateService = require('../clients/services/leadTypeAutoUpdateService');
const callStatusPollingService = require('../clients/services/callStatusPollingService');

class CronJobsInitializer {
  /**
   * Initialize all cron jobs
   */
  static initializeCronJobs() {
    console.log('\n🔧 Initializing background cron jobs...\n');

    // Auto-call service is started manually via API, not on server startup
    // This allows admins to control when auto-calling starts
    console.log('📞 Auto-call service: Ready (start via API)');

    // Schedule cron job to reset daily tracker at midnight
    cron.schedule('0 0 * * *', () => {
      console.log('🔄 Resetting daily auto-call tracker at midnight');
      autoCallService.resetDailyTracker();
    });

    // Schedule daily lead type auto-update at 10 AM
    cron.schedule('0 10 * * *', () => {
      console.log('📊 Running daily lead type auto-update at 10 AM');
      leadTypeAutoUpdateService.dailyLeadTypeUpdate();
    });

    // Schedule safety check for stalled calls at 3 PM (daily)
    // This is a fallback for calls that didn't receive webhook callback
    cron.schedule('0 15 * * *', () => {
      console.log('🔍 Running safety check for stalled calls at 3 PM');
      callStatusPollingService.safetyCheckStalledCalls();
    });

    // Schedule to process scheduled calls every 5 minutes
    // This checks for leads that have scheduled_call_time <= now
    cron.schedule('*/5 * * * *', () => {
      console.log('📅 Checking for scheduled calls to process...');
      scheduledCallsService.processPendingScheduledCalls();
    });

    console.log('✅ All cron jobs initialized successfully!\n');
  }

  /**
   * Stop all cron jobs (graceful shutdown)
   */
  static stopAllCronJobs() {
    console.log('\n🛑 Stopping all cron jobs...');
    autoCallService.stopAutoCall();
    console.log('✅ All cron jobs stopped\n');
  }
}

module.exports = CronJobsInitializer;
