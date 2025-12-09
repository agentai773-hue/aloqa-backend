const mongoose = require('mongoose');

const callLogSchema = new mongoose.Schema({
  // Basic identifiers
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CallCampaign',
    required: [true, 'Campaign ID is required'],
    index: true
  },
  
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead', // Assuming you have a Lead model
    required: [true, 'Lead ID is required'],
    index: true
  },
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  projectName: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    index: true
  },
  
  // Bolna-specific data
  bolnaExecutionId: {
    type: String,
    required: [true, 'Bolna execution ID is required'],
    unique: true,
    index: true
  },
  
  bolnaAgentId: {
    type: String,
    required: [true, 'Bolna agent ID is required'],
    index: true
  },
  
  // Call details
  callStatus: {
    type: String,
    enum: [
      'queued', 'ringing', 'in-progress', 'completed', 
      'call-disconnected', 'no-answer', 'busy', 'failed', 
      'canceled', 'balance-low'
    ],
    default: 'queued',
    index: true
  },
  
  phoneNumbers: {
    from: {
      type: String,
      required: true
    },
    to: {
      type: String,
      required: true
    }
  },
  
  // Call timing
  timing: {
    queuedAt: { type: Date, default: Date.now },
    initiatedAt: Date,
    answeredAt: Date,
    endedAt: Date,
    duration: Number, // seconds
    conversationTime: Number // seconds of actual conversation
  },
  
  // Call outcome and analysis
  outcome: {
    answeredByVoicemail: { type: Boolean, default: false },
    hangupBy: String, // 'Agent', 'Customer', 'System'
    hangupReason: String,
    
    // Customer interest detection
    customerInterested: {
      type: Boolean,
      default: null // null = not determined, true/false = determined
    },
    
    // Site visit scheduling
    siteVisitRequested: {
      type: Boolean,
      default: false
    },
    
    callbackRequested: {
      type: Boolean,
      default: false
    },
    
    // Lead qualification
    leadQuality: {
      type: String,
      enum: ['hot', 'warm', 'cold', 'unqualified'],
      default: null
    }
  },
  
  // Extracted structured data from Bolna
  extractedData: {
    type: mongoose.Schema.Types.Mixed, // Flexible JSON structure
    default: {}
  },
  
  // Call content
  transcript: {
    type: String,
    default: ''
  },
  
  // Call recording
  recording: {
    url: String,
    duration: Number,
    size: Number, // bytes
    provider: String // e.g., 'twilio'
  },
  
  // Cost information
  cost: {
    total: { type: Number, default: 0 }, // in cents
    breakdown: {
      llm: { type: Number, default: 0 },
      network: { type: Number, default: 0 },
      platform: { type: Number, default: 0 },
      synthesizer: { type: Number, default: 0 },
      transcriber: { type: Number, default: 0 }
    }
  },
  
  // Provider-specific data
  providerData: {
    providerCallId: String,
    provider: String, // 'twilio', etc.
    providerSpecificData: mongoose.Schema.Types.Mixed
  },
  
  // Error tracking
  errors: [{
    message: String,
    timestamp: { type: Date, default: Date.now },
    context: String
  }],
  
  // Retry information
  retryInfo: {
    attempt: { type: Number, default: 1 },
    maxAttempts: { type: Number, default: 3 },
    lastRetryAt: Date,
    retryReason: String
  },
  
  // Status tracking
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    details: String
  }]
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for common queries
callLogSchema.index({ userId: 1, projectName: 1, createdAt: -1 });
callLogSchema.index({ campaignId: 1, callStatus: 1 });
callLogSchema.index({ bolnaExecutionId: 1 }, { unique: true });
callLogSchema.index({ leadId: 1, callStatus: 1 });
callLogSchema.index({ 'outcome.customerInterested': 1, createdAt: -1 });
callLogSchema.index({ 'timing.endedAt': -1 }); // For recent calls

// Virtual fields
callLogSchema.virtual('isCompleted').get(function() {
  return ['completed', 'call-disconnected', 'no-answer', 'busy', 'failed'].includes(this.callStatus);
});

callLogSchema.virtual('wasSuccessful').get(function() {
  return this.callStatus === 'completed' && !this.outcome.answeredByVoicemail;
});

callLogSchema.virtual('callDurationFormatted').get(function() {
  if (!this.timing.duration) return '0:00';
  const minutes = Math.floor(this.timing.duration / 60);
  const seconds = this.timing.duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Instance methods
callLogSchema.methods.updateStatus = function(newStatus, details = '') {
  this.callStatus = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    details
  });
  
  // Update timing based on status
  const now = new Date();
  switch (newStatus) {
    case 'initiated':
      this.timing.initiatedAt = now;
      break;
    case 'ringing':
      // Keep existing initiatedAt
      break;
    case 'in-progress':
      this.timing.answeredAt = now;
      break;
    case 'completed':
    case 'call-disconnected':
    case 'failed':
    case 'no-answer':
    case 'busy':
      this.timing.endedAt = now;
      if (this.timing.answeredAt) {
        this.timing.conversationTime = Math.floor((now - this.timing.answeredAt) / 1000);
      }
      if (this.timing.initiatedAt) {
        this.timing.duration = Math.floor((now - this.timing.initiatedAt) / 1000);
      }
      break;
  }
};

// Static methods
callLogSchema.statics.getCallStats = function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: null,
        totalCalls: { $sum: 1 },
        completedCalls: { 
          $sum: { 
            $cond: [{ $eq: ['$callStatus', 'completed'] }, 1, 0] 
          } 
        },
        interestedLeads: { 
          $sum: { 
            $cond: [{ $eq: ['$outcome.customerInterested', true] }, 1, 0] 
          } 
        },
        totalCost: { $sum: '$cost.total' },
        avgDuration: { $avg: '$timing.conversationTime' }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

module.exports = mongoose.model('CallLog', callLogSchema);