const mongoose = require('mongoose');

const webhookEventSchema = new mongoose.Schema({
  // Event identification
  eventType: {
    type: String,
    enum: [
      'call.initiated',
      'call.ringing', 
      'call.answered',
      'call.completed',
      'call.failed',
      'call.disconnected',
      'execution.completed',
      'data.extracted'
    ],
    required: [true, 'Event type is required'],
    index: true
  },
  
  source: {
    type: String,
    enum: ['bolna', 'system', 'manual'],
    default: 'bolna',
    required: true
  },
  
  // Bolna execution details
  bolnaExecutionId: {
    type: String,
    required: [true, 'Bolna execution ID is required'],
    index: true
  },
  
  bolnaAgentId: {
    type: String,
    required: [true, 'Bolna agent ID is required']
  },
  
  // Internal references
  callLogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CallLog',
    index: true
  },
  
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CallCampaign',
    index: true
  },
  
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    index: true
  },
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  // Raw webhook data from Bolna
  rawPayload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // Processed event data
  processedData: {
    // Call status information
    callStatus: String,
    duration: Number,
    cost: Number,
    
    // Customer interaction data
    transcript: String,
    extractedData: mongoose.Schema.Types.Mixed,
    
    // Interest detection
    customerInterested: Boolean,
    siteVisitRequested: Boolean,
    callbackRequested: Boolean,
    
    // Recording information
    recordingUrl: String,
    recordingDuration: Number,
    
    // Telephony data
    fromNumber: String,
    toNumber: String,
    hangupBy: String,
    hangupReason: String
  },
  
  // Processing status
  processing: {
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true
    },
    
    processedAt: Date,
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    
    errors: [{
      attempt: Number,
      error: String,
      timestamp: { type: Date, default: Date.now },
      stackTrace: String
    }],
    
    // Actions taken
    actionsPerformed: [{
      action: {
        type: String,
        enum: [
          'call_log_updated',
          'campaign_updated', 
          'site_visit_scheduled',
          'lead_updated',
          'notification_sent',
          'agent_load_updated'
        ]
      },
      status: String,
      timestamp: { type: Date, default: Date.now },
      details: mongoose.Schema.Types.Mixed
    }]
  },
  
  // Request details
  request: {
    headers: mongoose.Schema.Types.Mixed,
    ip: String,
    userAgent: String,
    timestamp: { type: Date, default: Date.now }
  },
  
  // Response sent back to webhook
  response: {
    status: Number,
    message: String,
    sentAt: Date
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
webhookEventSchema.index({ bolnaExecutionId: 1, eventType: 1 });
webhookEventSchema.index({ userId: 1, createdAt: -1 });
webhookEventSchema.index({ 'processing.status': 1, createdAt: 1 });
webhookEventSchema.index({ eventType: 1, createdAt: -1 });

// Virtual fields
webhookEventSchema.virtual('isProcessed').get(function() {
  return this.processing.status === 'completed';
});

webhookEventSchema.virtual('needsRetry').get(function() {
  return this.processing.status === 'failed' && 
         this.processing.attempts < this.processing.maxAttempts;
});

// Instance methods
webhookEventSchema.methods.markProcessing = function() {
  this.processing.status = 'processing';
  this.processing.attempts += 1;
  return this.save();
};

webhookEventSchema.methods.markCompleted = function(actionsPerformed = []) {
  this.processing.status = 'completed';
  this.processing.processedAt = new Date();
  this.processing.actionsPerformed.push(...actionsPerformed);
  return this.save();
};

webhookEventSchema.methods.markFailed = function(error, stackTrace = '') {
  this.processing.status = 'failed';
  this.processing.errors.push({
    attempt: this.processing.attempts,
    error: error.message || error,
    timestamp: new Date(),
    stackTrace
  });
  return this.save();
};

webhookEventSchema.methods.addActionPerformed = function(action, status, details = {}) {
  this.processing.actionsPerformed.push({
    action,
    status,
    timestamp: new Date(),
    details
  });
};

// Static methods
webhookEventSchema.statics.getPendingEvents = function(limit = 100) {
  return this.find({
    'processing.status': { $in: ['pending', 'failed'] },
    'processing.attempts': { $lt: 3 }
  })
  .sort({ createdAt: 1 })
  .limit(limit);
};

webhookEventSchema.statics.getEventsByExecution = function(bolnaExecutionId) {
  return this.find({ bolnaExecutionId })
    .sort({ createdAt: 1 });
};

webhookEventSchema.statics.getRecentEvents = function(userId, hours = 24, limit = 50) {
  const since = new Date();
  since.setHours(since.getHours() - hours);
  
  return this.find({
    userId,
    createdAt: { $gte: since }
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('callLogId')
  .populate('campaignId')
  .populate('leadId');
};

webhookEventSchema.statics.getProcessingStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$processing.status',
        count: { $sum: 1 },
        latestEvent: { $max: '$createdAt' }
      }
    }
  ]);
};

// Pre-save middleware
webhookEventSchema.pre('save', function(next) {
  // Auto-generate response if not set
  if (this.isNew && !this.response.status) {
    this.response = {
      status: 200,
      message: 'Webhook received',
      sentAt: new Date()
    };
  }
  next();
});

module.exports = mongoose.model('WebhookEvent', webhookEventSchema);