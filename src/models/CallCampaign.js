const mongoose = require('mongoose');

const callCampaignSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  campaignName: {
    type: String,
    required: [true, 'Campaign name is required'],
    trim: true
  },
  
  projectName: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    index: true
  },
  
  status: {
    type: String,
    enum: ['pending', 'running', 'paused', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  totalLeads: {
    type: Number,
    required: true,
    min: 1
  },
  
  completedCalls: {
    type: Number,
    default: 0
  },
  
  successfulCalls: {
    type: Number,
    default: 0
  },
  
  failedCalls: {
    type: Number,
    default: 0
  },
  
  interestedLeads: {
    type: Number,
    default: 0
  },
  
  // Agent assignment and load balancing
  assignedAgents: [{
    agentId: String, // Bolna agent ID
    agentName: String,
    assignedLeadsCount: Number,
    completedCalls: Number,
    activeCalls: Number,
    maxConcurrentCalls: { type: Number, default: 7 }
  }],
  
  // Lead assignments per agent
  leadDistribution: [{
    agentId: String,
    leadIds: [mongoose.Schema.Types.ObjectId],
    status: {
      type: String,
      enum: ['pending', 'calling', 'completed'],
      default: 'pending'
    }
  }],
  
  // Campaign settings
  settings: {
    maxConcurrentCallsPerAgent: { type: Number, default: 7 },
    callRetryAttempts: { type: Number, default: 3 },
    delayBetweenCalls: { type: Number, default: 30 }, // seconds
    scheduleStartTime: Date,
    scheduleEndTime: Date
  },
  
  // Metrics and analytics
  metrics: {
    totalCost: { type: Number, default: 0 },
    averageCallDuration: { type: Number, default: 0 },
    averageCallCost: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 }, // interested/total ratio
    startedAt: Date,
    completedAt: Date
  },
  
  // Error tracking
  errors: [{
    leadId: mongoose.Schema.Types.ObjectId,
    agentId: String,
    error: String,
    timestamp: { type: Date, default: Date.now }
  }]
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
callCampaignSchema.index({ userId: 1, projectName: 1 });
callCampaignSchema.index({ status: 1, createdAt: -1 });
callCampaignSchema.index({ 'assignedAgents.agentId': 1 });

// Virtual fields
callCampaignSchema.virtual('progressPercentage').get(function() {
  if (this.totalLeads === 0) return 0;
  return Math.round((this.completedCalls / this.totalLeads) * 100);
});

callCampaignSchema.virtual('pendingCalls').get(function() {
  return this.totalLeads - this.completedCalls;
});

module.exports = mongoose.model('CallCampaign', callCampaignSchema);