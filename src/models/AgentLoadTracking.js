const mongoose = require('mongoose');

const agentLoadTrackingSchema = new mongoose.Schema({
  // Agent identification
  bolnaAgentId: {
    type: String,
    required: [true, 'Bolna agent ID is required'],
    index: true
  },
  
  agentName: {
    type: String,
    required: [true, 'Agent name is required'],
    trim: true
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
  
  // Current load status
  currentLoad: {
    activeCalls: {
      type: Number,
      default: 0,
      min: 0
    },
    maxConcurrentCalls: {
      type: Number,
      default: 7,
      min: 1,
      max: 15
    },
    queuedCalls: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // Performance metrics
  performance: {
    // Today's statistics
    today: {
      totalCalls: { type: Number, default: 0 },
      completedCalls: { type: Number, default: 0 },
      successfulCalls: { type: Number, default: 0 },
      totalDuration: { type: Number, default: 0 }, // seconds
      totalCost: { type: Number, default: 0 }, // cents
      interestedLeads: { type: Number, default: 0 },
      siteVisitsScheduled: { type: Number, default: 0 },
      lastCallAt: Date,
      firstCallAt: Date
    },
    
    // This week's statistics
    thisWeek: {
      totalCalls: { type: Number, default: 0 },
      completedCalls: { type: Number, default: 0 },
      successfulCalls: { type: Number, default: 0 },
      totalDuration: { type: Number, default: 0 },
      totalCost: { type: Number, default: 0 },
      interestedLeads: { type: Number, default: 0 },
      siteVisitsScheduled: { type: Number, default: 0 }
    },
    
    // This month's statistics
    thisMonth: {
      totalCalls: { type: Number, default: 0 },
      completedCalls: { type: Number, default: 0 },
      successfulCalls: { type: Number, default: 0 },
      totalDuration: { type: Number, default: 0 },
      totalCost: { type: Number, default: 0 },
      interestedLeads: { type: Number, default: 0 },
      siteVisitsScheduled: { type: Number, default: 0 }
    },
    
    // All-time statistics
    allTime: {
      totalCalls: { type: Number, default: 0 },
      completedCalls: { type: Number, default: 0 },
      successfulCalls: { type: Number, default: 0 },
      totalDuration: { type: Number, default: 0 },
      totalCost: { type: Number, default: 0 },
      interestedLeads: { type: Number, default: 0 },
      siteVisitsScheduled: { type: Number, default: 0 }
    }
  },
  
  // Agent availability and scheduling
  availability: {
    status: {
      type: String,
      enum: ['available', 'busy', 'offline', 'maintenance'],
      default: 'available',
      index: true
    },
    
    workingHours: {
      start: { type: String, default: '09:00' }, // "09:00"
      end: { type: String, default: '18:00' },   // "18:00"
      timezone: { type: String, default: 'Asia/Kolkata' }
    },
    
    workingDays: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    
    lastActiveAt: { type: Date, default: Date.now },
    lastCallCompletedAt: Date,
    estimatedNextAvailableAt: Date
  },
  
  // Current campaign assignments
  currentCampaigns: [{
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CallCampaign'
    },
    assignedLeads: Number,
    completedLeads: Number,
    assignedAt: { type: Date, default: Date.now },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    }
  }],
  
  // Active calls tracking
  activeCalls: [{
    callLogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CallLog'
    },
    bolnaExecutionId: String,
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead'
    },
    startedAt: { type: Date, default: Date.now },
    status: String, // 'queued', 'ringing', 'in-progress'
    estimatedDuration: Number // seconds
  }],
  
  // Queue management
  callQueue: [{
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead'
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CallCampaign'
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    queuedAt: { type: Date, default: Date.now },
    scheduledFor: Date, // If specific time scheduling is needed
    retryAttempt: { type: Number, default: 0 }
  }],
  
  // Agent configuration and limits
  configuration: {
    callTimeoutSeconds: { type: Number, default: 300 }, // 5 minutes
    maxRetryAttempts: { type: Number, default: 3 },
    delayBetweenCalls: { type: Number, default: 30 }, // seconds
    maxCallsPerHour: { type: Number, default: 20 },
    maxDailyDuration: { type: Number, default: 28800 }, // 8 hours in seconds
    
    // Performance thresholds
    minSuccessRate: { type: Number, default: 0.3 }, // 30%
    minInterestRate: { type: Number, default: 0.1 }, // 10%
    maxCostPerCall: { type: Number, default: 500 }   // 5.00 in cents
  },
  
  // Health and monitoring
  health: {
    status: {
      type: String,
      enum: ['healthy', 'warning', 'critical', 'offline'],
      default: 'healthy'
    },
    lastHealthCheck: { type: Date, default: Date.now },
    issues: [{
      type: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      },
      message: String,
      detectedAt: { type: Date, default: Date.now },
      resolvedAt: Date
    }],
    
    // Performance alerts
    alerts: [{
      type: {
        type: String,
        enum: ['low_success_rate', 'high_cost', 'long_duration', 'queue_buildup', 'offline']
      },
      message: String,
      triggeredAt: { type: Date, default: Date.now },
      acknowledged: { type: Boolean, default: false },
      acknowledgedAt: Date,
      acknowledgedBy: String
    }]
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for performance
agentLoadTrackingSchema.index({ bolnaAgentId: 1, userId: 1, projectName: 1 });
agentLoadTrackingSchema.index({ userId: 1, 'availability.status': 1 });
agentLoadTrackingSchema.index({ 'currentLoad.activeCalls': 1, 'availability.status': 1 });
agentLoadTrackingSchema.index({ projectName: 1, 'performance.today.completedCalls': -1 });

// Virtual fields
agentLoadTrackingSchema.virtual('isAvailable').get(function() {
  return this.availability.status === 'available' && 
         this.currentLoad.activeCalls < this.currentLoad.maxConcurrentCalls;
});

agentLoadTrackingSchema.virtual('availableSlots').get(function() {
  return this.currentLoad.maxConcurrentCalls - this.currentLoad.activeCalls;
});

agentLoadTrackingSchema.virtual('todaySuccessRate').get(function() {
  const completed = this.performance.today.completedCalls;
  const total = this.performance.today.totalCalls;
  return total > 0 ? (completed / total) : 0;
});

agentLoadTrackingSchema.virtual('todayInterestRate').get(function() {
  const interested = this.performance.today.interestedLeads;
  const completed = this.performance.today.completedCalls;
  return completed > 0 ? (interested / completed) : 0;
});

agentLoadTrackingSchema.virtual('averageCallCost').get(function() {
  const cost = this.performance.today.totalCost;
  const calls = this.performance.today.completedCalls;
  return calls > 0 ? (cost / calls) : 0;
});

// Instance methods
agentLoadTrackingSchema.methods.addActiveCall = function(callLogId, bolnaExecutionId, leadId, estimatedDuration = 300) {
  this.activeCalls.push({
    callLogId,
    bolnaExecutionId,
    leadId,
    startedAt: new Date(),
    status: 'queued',
    estimatedDuration
  });
  
  this.currentLoad.activeCalls = this.activeCalls.length;
  
  // Update availability if at max capacity
  if (this.currentLoad.activeCalls >= this.currentLoad.maxConcurrentCalls) {
    this.availability.status = 'busy';
    this.availability.estimatedNextAvailableAt = new Date(Date.now() + (estimatedDuration * 1000));
  }
  
  this.availability.lastActiveAt = new Date();
};

agentLoadTrackingSchema.methods.removeActiveCall = function(bolnaExecutionId) {
  this.activeCalls = this.activeCalls.filter(call => 
    call.bolnaExecutionId !== bolnaExecutionId
  );
  
  this.currentLoad.activeCalls = this.activeCalls.length;
  this.availability.lastCallCompletedAt = new Date();
  
  // Update availability if below max capacity
  if (this.currentLoad.activeCalls < this.currentLoad.maxConcurrentCalls) {
    this.availability.status = 'available';
    this.availability.estimatedNextAvailableAt = null;
  }
};

agentLoadTrackingSchema.methods.addToQueue = function(leadId, campaignId, priority = 'medium') {
  this.callQueue.push({
    leadId,
    campaignId,
    priority,
    queuedAt: new Date()
  });
  
  this.currentLoad.queuedCalls = this.callQueue.length;
};

agentLoadTrackingSchema.methods.getNextFromQueue = function() {
  // Sort by priority and queue time
  this.callQueue.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return a.queuedAt - b.queuedAt;
  });
  
  const nextCall = this.callQueue.shift();
  this.currentLoad.queuedCalls = this.callQueue.length;
  
  return nextCall;
};

agentLoadTrackingSchema.methods.updatePerformanceMetrics = function(callData) {
  const { duration, cost, wasSuccessful, isInterested, siteVisitScheduled } = callData;
  
  // Update today's metrics
  this.performance.today.totalCalls += 1;
  if (wasSuccessful) this.performance.today.completedCalls += 1;
  if (wasSuccessful) this.performance.today.successfulCalls += 1;
  if (duration) this.performance.today.totalDuration += duration;
  if (cost) this.performance.today.totalCost += cost;
  if (isInterested) this.performance.today.interestedLeads += 1;
  if (siteVisitScheduled) this.performance.today.siteVisitsScheduled += 1;
  
  this.performance.today.lastCallAt = new Date();
  if (!this.performance.today.firstCallAt) {
    this.performance.today.firstCallAt = new Date();
  }
  
  // Update other periods (week, month, all-time) similarly
  ['thisWeek', 'thisMonth', 'allTime'].forEach(period => {
    this.performance[period].totalCalls += 1;
    if (wasSuccessful) this.performance[period].completedCalls += 1;
    if (wasSuccessful) this.performance[period].successfulCalls += 1;
    if (duration) this.performance[period].totalDuration += duration;
    if (cost) this.performance[period].totalCost += cost;
    if (isInterested) this.performance[period].interestedLeads += 1;
    if (siteVisitScheduled) this.performance[period].siteVisitsScheduled += 1;
  });
};

// Static methods
agentLoadTrackingSchema.statics.getAvailableAgents = function(userId, projectName, requiredSlots = 1) {
  return this.find({
    userId,
    projectName,
    'availability.status': 'available',
    $expr: {
      $gte: [
        { $subtract: ['$currentLoad.maxConcurrentCalls', '$currentLoad.activeCalls'] },
        requiredSlots
      ]
    }
  }).sort({ 'currentLoad.activeCalls': 1, 'performance.today.completedCalls': 1 });
};

agentLoadTrackingSchema.statics.getLeastLoadedAgent = function(userId, projectName) {
  return this.findOne({
    userId,
    projectName,
    'availability.status': 'available',
    $expr: {
      $lt: ['$currentLoad.activeCalls', '$currentLoad.maxConcurrentCalls']
    }
  }).sort({ 'currentLoad.activeCalls': 1 });
};

agentLoadTrackingSchema.statics.getAgentPerformance = function(userId, projectName = null, period = 'today') {
  const filter = { userId };
  if (projectName) filter.projectName = projectName;
  
  return this.find(filter)
    .select(`bolnaAgentId agentName performance.${period}`)
    .sort({ [`performance.${period}.completedCalls`]: -1 });
};

module.exports = mongoose.model('AgentLoadTracking', agentLoadTrackingSchema);