const mongoose = require('mongoose');

const callHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
    },
    agentId: {
      type: String,
      required: true, // Bolna agent ID
    },
    phoneNumberId: {
      type: String,
      default: null, // Phone number string (from Bolna) or MongoDB ObjectId
    },
    recipientPhoneNumber: {
      type: String,
      required: true,
    },
    callerName: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['initiated', 'queued', 'ringing', 'connected', 'in-progress', 'completed', 'failed', 'cancelled'],
      default: 'initiated',
    },
    callDuration: {
      type: Number,
      default: 0, // in seconds
    },
    recordingUrl: {
      type: String,
      default: null,
    },
    recordingId: {
      type: String,
      default: null, // Bolna recording ID
    },
    webhookUrl: {
      type: String,
      default: null,
    },
    callId: {
      type: String,
      default: null, // Bolna call ID (from execution details)
    },
    executionId: {
      type: String,
      default: null, // Bolna execution ID (from initial response)
    },
    runId: {
      type: String,
      default: null, // Bolna run ID
    },
    // Bolna API response details
    bolnaResponse: {
      call_id: String,
      status: String,
      agent_id: String,
    },
    // Execution details from Bolna executions API
    executionDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // Webhook callback details
    webhookData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    projectName: {
      type: String,
      default: null,
    },
    assistantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assistant',
      default: null,
    },
    lastStatusCheck: {
      type: Date,
      default: null,
    },
    lastStatusCheckResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // Conversation transcript from Bolna
    conversationTranscript: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    conversationMessages: [
      {
        role: { type: String, enum: ['user', 'agent'] },
        message: String,
        timestamp: Date,
      }
    ],
    // Auto-call tracking
    isAutoCall: {
      type: Boolean,
      default: false,
    },
    // Number of attempts for this lead - now limited to 1
    callAttemptNumber: {
      type: Number,
      default: 0,
    },
    // Scheduled call time - when this lead should be called next
    scheduledCallTime: {
      type: Date,
      default: null,
    },
    // Reason why this call is scheduled (extracted from transcript)
    scheduledCallReason: {
      type: String,
      default: null,
    },
    // Flag to mark if this call's transcript has been analyzed
    transcriptAnalyzed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
callHistorySchema.index({ userId: 1, createdAt: -1 });
callHistorySchema.index({ leadId: 1 });
callHistorySchema.index({ callId: 1 });
callHistorySchema.index({ executionId: 1 });
callHistorySchema.index({ runId: 1 });
// Index for scheduled calls query
callHistorySchema.index({ scheduledCallTime: 1, transcriptAnalyzed: 1 });

module.exports = mongoose.model('CallHistory', callHistorySchema);
