/**
 * Transcript Analysis Service
 * Analyzes call transcripts to extract lead status and scheduled call times
 */

const Lead = require('../../models/Lead');
const CallHistory = require('../../models/CallHistory');

class TranscriptAnalysisService {
  /**
   * Analyze transcript and update lead status
   * Detects: "hot", "not_interested", "fake", or "site_visit_scheduled"
   */
  async analyzeTranscript(callHistoryId) {
    try {
      const callHistory = await CallHistory.findById(callHistoryId).populate('leadId');
      
      if (!callHistory) {
        console.error(`❌ CallHistory not found: ${callHistoryId}`);
        return { success: false, error: 'CallHistory not found' };
      }

      if (callHistory.transcriptAnalyzed) {
        console.log('📝 Transcript already analyzed:', callHistoryId);
        return { success: true, alreadyAnalyzed: true };
      }

      const transcript = this.getTranscriptText(callHistory);
      
      if (!transcript) {
        console.warn('⚠️  No transcript found in call history:', callHistoryId);
        return { success: false, error: 'No transcript available' };
      }

      if (!callHistory.leadId) {
        console.warn('⚠️  No lead associated with this call:', callHistoryId);
        return { success: false, error: 'No lead associated with call' };
      }

      console.log(`🔍 Analyzing transcript for lead: ${callHistory.leadId?.full_name}`);

      // Analyze for lead type and scheduling
      const analysis = this.parseTranscript(transcript);
      
      // Update lead status based on analysis
      if (analysis.leadType) {
        try {
          const leadId = callHistory.leadId._id || callHistory.leadId;
          const updateData = {
            lead_type: analysis.leadType,
            call_status: analysis.leadType === 'not_interested' || analysis.leadType === 'fake' ? 'completed' : 'connected'
          };
          
          const updatedLead = await Lead.findByIdAndUpdate(leadId, updateData, { new: true });
          console.log(`✅ Lead updated - ID: ${leadId}, Type: ${analysis.leadType}, Status: ${updateData.call_status}`);
        } catch (updateError) {
          console.error('❌ Error updating lead:', updateError.message);
        }
      }

      // Handle scheduled calls
      if (analysis.scheduledTime) {
        await this.scheduleNextCall(callHistory, analysis);
        console.log(`📅 Next call scheduled for: ${analysis.scheduledTime}`);
      }

      // Mark transcript as analyzed
      await CallHistory.updateOne(
        { _id: callHistoryId },
        {
          transcriptAnalyzed: true,
          scheduledCallTime: analysis.scheduledTime || null,
          scheduledCallReason: analysis.reason || null
        }
      );

      return {
        success: true,
        leadType: analysis.leadType,
        scheduledTime: analysis.scheduledTime,
        reason: analysis.reason
      };
    } catch (error) {
      console.error('❌ Error in analyzeTranscript:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Extract transcript text from various formats
   */
  getTranscriptText(callHistory) {
    // Try different transcript sources
    if (callHistory.conversationTranscript?.transcript) {
      return callHistory.conversationTranscript.transcript;
    }
    if (callHistory.conversationTranscript?.full_transcript) {
      return callHistory.conversationTranscript.full_transcript;
    }
    if (typeof callHistory.conversationTranscript === 'string') {
      return callHistory.conversationTranscript;
    }
    
    // Try messages format
    if (Array.isArray(callHistory.conversationMessages)) {
      return callHistory.conversationMessages
        .map(msg => `${msg.role}: ${msg.message}`)
        .join('\n');
    }

    if (callHistory.webhookData?.transcript) {
      return callHistory.webhookData.transcript;
    }
    if (callHistory.webhookData?.conversationTranscript) {
      return callHistory.webhookData.conversationTranscript;
    }

    return null;
  }

  /**
   * Parse transcript to extract lead type and scheduling info
   * Returns: { leadType, scheduledTime, reason }
   */
  parseTranscript(transcript) {
    const transcriptLower = transcript.toLowerCase();

    // Keywords for different lead types
    const hotKeywords = [
      'interested',
      'definitely',
      'sure',
      'yes',
      'confirm',
      'book',
      'site visit',
      'visit today',
      'meet you',
      'when can i come',
      'ready to visit',
      'looking forward'
    ];

    const notInterestedKeywords = [
      'not interested',
      'not suitable',
      'not my requirement',
      'too expensive',
      'out of budget',
      'no thanks',
      'not looking',
      'decided against',
      'going elsewhere',
      'changed mind',
      'not the right one'
    ];

    const fakeKeywords = [
      'wrong number',
      'not applicable',
      'bot call',
      'automated',
      'test call',
      'invalid',
      'spam'
    ];

    // Check for lead type
    let leadType = 'cold'; // default

    if (hotKeywords.some(keyword => transcriptLower.includes(keyword))) {
      leadType = 'hot';
    } else if (notInterestedKeywords.some(keyword => transcriptLower.includes(keyword))) {
      leadType = 'not_interested';
    } else if (fakeKeywords.some(keyword => transcriptLower.includes(keyword))) {
      leadType = 'fake';
    }

    // Extract scheduled time and reason
    const schedulingInfo = this.extractSchedulingInfo(transcript);

    return {
      leadType,
      scheduledTime: schedulingInfo.time,
      reason: schedulingInfo.reason
    };
  }

  /**
   * Extract scheduled call time from transcript
   * ONLY if user explicitly mentions scheduling/visiting (keywords: schedule, book, visit, come, site visit, etc.)
   * Don't auto-schedule if no explicit mention
   */
  extractSchedulingInfo(transcript) {
    const transcriptLower = transcript.toLowerCase();
    
    // Check if user actually mentioned visiting/scheduling/booking
    const schedulingKeywords = [
      'schedule',
      'book',
      'visit',
      'come',
      'site visit',
      'when',
      'time',
      'appointment',
      'meet',
      'visit today',
      'call me',
      'am',
      'pm',
      'o\'clock'
    ];

    // If no scheduling keywords found, don't schedule anything
    const hasSchedulingIntent = schedulingKeywords.some(keyword => transcriptLower.includes(keyword));
    
    if (!hasSchedulingIntent) {
      console.log('⚠️  No scheduling keywords found in transcript - not scheduling');
      return { time: null, reason: null };
    }

    let scheduledTime = null;
    let reason = 'Follow-up call';

    // Pattern: Specific time like "3 PM", "15:00", "3:30 PM"
    const timeMatch = transcriptLower.match(/(\d{1,2}):?(\d{2})?\s*(am|pm|AM|PM)/);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const period = timeMatch[3].toLowerCase();

      // Convert to 24-hour format
      if (period === 'pm' && hours !== 12) {
        hours += 12;
      } else if (period === 'am' && hours === 12) {
        hours = 0;
      }

      // Create date for today at that time
      scheduledTime = new Date();
      scheduledTime.setHours(hours, minutes, 0, 0);

      // If time is in the past, schedule for tomorrow
      if (scheduledTime < new Date()) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      reason = `Site visit scheduled for ${timeMatch[1]}:${timeMatch[2] || '00'} ${timeMatch[3]}`;
      console.log(`✅ Detected specific time: ${hours}:${minutes}`);
      return { time: scheduledTime, reason };
    }

    // Pattern: "call in X minutes/hours/days"
    const minuteMatch = transcriptLower.match(/call\s+(?:me\s+)?(?:in|after|back\s+in)\s+(\d+)\s+(?:minutes?|mins?)/i);
    if (minuteMatch) {
      const minutes = parseInt(minuteMatch[1]);
      scheduledTime = new Date(Date.now() + minutes * 60 * 1000);
      reason = `Follow-up call in ${minutes} minutes`;
      return { time: scheduledTime, reason };
    }

    // Hinglish pattern: "10 minute baad" / "10 min baad" / "call 10 min baad"
    const hindiMinuteMatch = transcriptLower.match(/(?:call|karna|karni)?\s*(\d+)\s+(?:minute|min)(?:\s+baad|ba\w*)/i);
    if (hindiMinuteMatch) {
      const minutes = parseInt(hindiMinuteMatch[1]);
      scheduledTime = new Date(Date.now() + minutes * 60 * 1000);
      reason = `Follow-up call in ${minutes} minutes`;
      console.log(`✅ Detected Hinglish pattern: ${minutes} minute baad`);
      return { time: scheduledTime, reason };
    }

    const hourMatch = transcriptLower.match(/call\s+(?:me\s+)?(?:in|after)\s+(\d+)\s+(?:hours?)/i);
    if (hourMatch) {
      const hours = parseInt(hourMatch[1]);
      scheduledTime = new Date(Date.now() + hours * 60 * 60 * 1000);
      reason = `Follow-up call in ${hours} hours`;
      return { time: scheduledTime, reason };
    }

    const dayMatch = transcriptLower.match(/call\s+(?:me\s+)?(?:in|after|tomorrow|next|in\s+)(\d+)?\s*(?:days?)/i);
    if (dayMatch) {
      const days = dayMatch[1] ? parseInt(dayMatch[1]) : 1;
      scheduledTime = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      reason = `Follow-up call in ${days} day(s)`;
      return { time: scheduledTime, reason };
    }

    // "call tomorrow"
    if (transcriptLower.includes('call tomorrow') || (transcriptLower.includes('tomorrow') && transcriptLower.includes('call'))) {
      scheduledTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      reason = 'Follow-up call tomorrow';
      return { time: scheduledTime, reason };
    }

    // "call next week"
    if (transcriptLower.includes('next week')) {
      scheduledTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      reason = 'Follow-up call next week';
      return { time: scheduledTime, reason };
    }

    // "visit tomorrow" or "come tomorrow"
    if (transcriptLower.includes('visit tomorrow') || transcriptLower.includes('come tomorrow')) {
      scheduledTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      reason = 'Site visit scheduled for tomorrow';
      return { time: scheduledTime, reason };
    }

    return { time: null, reason };
  }

  /**
   * Schedule next call for lead
   */
  async scheduleNextCall(callHistory, analysis) {
    try {
      const lead = callHistory.leadId;
      
      if (!lead) {
        console.warn('⚠️  Lead not found in call history');
        return;
      }

      // Update lead with scheduled call time
      await Lead.updateOne(
        { _id: lead._id },
        {
          scheduled_call_time: analysis.scheduledTime,
          scheduled_call_reason: analysis.reason,
          call_status: 'scheduled'
        }
      );

      console.log(`📅 Lead scheduled for next call: ${analysis.scheduledTime}`);
    } catch (error) {
      console.error('❌ Error scheduling next call:', error);
    }
  }
}

module.exports = new TranscriptAnalysisService();
