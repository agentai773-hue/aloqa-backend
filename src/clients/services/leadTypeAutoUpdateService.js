/**
 * Lead Type Auto-Update Service
 * Automatically updates lead types based on:
 * 1. Leads older than 10 days → "cold"
 * 2. Not interested keywords in transcript → "not_interested"
 * 3. Site visit confirmed → "hot"
 */

const Lead = require('../../models/Lead');
const SiteVisit = require('../../models/SiteVisit');
const CallHistory = require('../../models/CallHistory');

class LeadTypeAutoUpdateService {
  /**
   * Auto-update lead type for leads older than 10 days
   * If lead is still pending and older than 10 days → mark as "cold"
   */
  async updateOldLeadsToCold() {
    try {
      console.log('🔄 Checking for leads older than 10 days...');

      // Calculate date 10 days ago
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

      // Find leads that are:
      // 1. created before 10 days ago
      // 2. still in "pending" or "cold" state (not hot, fake, not_interested)
      // 3. not deleted
      const oldLeads = await Lead.updateMany(
        {
          created_at: { $lt: tenDaysAgo },
          lead_type: { $in: ['pending', 'cold'] },
          deleted_at: null,
        },
        {
          $set: { lead_type: 'cold' },
        }
      );

      console.log(`✅ Updated ${oldLeads.modifiedCount} leads to "cold" (older than 10 days)`);
      return {
        success: true,
        updated: oldLeads.modifiedCount,
      };
    } catch (error) {
      console.error('❌ Error updating old leads to cold:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update lead type to "not_interested" if confirmed in transcript
   * Called when call is completed and transcript analyzed
   */
  async updateNotInterestedFromTranscript(leadId) {
    try {
      // This is already handled in transcriptAnalysisService.parseTranscript()
      // But we can add additional logic here if needed
      console.log(`📝 Lead ${leadId} checked for "not interested" status`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error checking not interested:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update lead type to "hot" when site visit is confirmed
   * Should be called when site visit status changes to "completed"
   */
  async updateHotOnSiteVisitConfirmed(leadId) {
    try {
      console.log(`🏢 Confirming site visit for lead ${leadId}...`);

      // Check if there's a completed site visit for this lead
      const completedVisit = await SiteVisit.findOne({
        leadId: leadId,
        status: 'completed',
      });

      if (completedVisit) {
        // Update lead to "hot"
        const updatedLead = await Lead.findByIdAndUpdate(
          leadId,
          {
            $set: { lead_type: 'hot' },
          },
          { new: true }
        );

        console.log(`✅ Lead ${leadId} updated to "hot" due to confirmed site visit`);
        return {
          success: true,
          lead: updatedLead,
        };
      }

      return {
        success: true,
        message: 'No completed site visit found',
      };
    } catch (error) {
      console.error('❌ Error updating lead to hot:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check and update all leads based on site visit status
   * Run periodically to catch any completed site visits
   */
  async checkAndUpdateFromCompletedSiteVisits() {
    try {
      console.log('🏢 Checking for completed site visits...');

      // Find all leads with completed site visits
      const completedVisits = await SiteVisit.find({
        status: 'completed',
      }).populate('leadId');

      if (completedVisits.length === 0) {
        console.log('✅ No new completed site visits');
        return { success: true, updated: 0 };
      }

      let updatedCount = 0;

      for (const visit of completedVisits) {
        if (!visit.leadId) continue;

        // Only update if current lead type is not already hot or not_interested
        if (
          visit.leadId.lead_type !== 'hot' &&
          visit.leadId.lead_type !== 'not_interested' &&
          visit.leadId.lead_type !== 'fake'
        ) {
          await Lead.findByIdAndUpdate(
            visit.leadId._id,
            { $set: { lead_type: 'hot' } }
          );
          updatedCount++;
          console.log(`✅ Lead ${visit.leadId._id} → "hot" (completed site visit)`);
        }
      }

      console.log(`✅ Updated ${updatedCount} leads to "hot" from completed site visits`);
      return { success: true, updated: updatedCount };
    } catch (error) {
      console.error('❌ Error checking site visits:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Comprehensive daily lead type update
   * Called once per day to check all conditions
   */
  async dailyLeadTypeUpdate() {
    try {
      console.log('\n📊 Running daily lead type auto-update...\n');

      const results = {
        oldLeadsToCold: await this.updateOldLeadsToCold(),
        siteVisitHots: await this.checkAndUpdateFromCompletedSiteVisits(),
      };

      console.log('\n✅ Daily lead type update complete\n');
      return { success: true, results };
    } catch (error) {
      console.error('❌ Error in daily lead type update:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new LeadTypeAutoUpdateService();
