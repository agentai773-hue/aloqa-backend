const mongoose = require('mongoose');

const siteVisitScheduleSchema = new mongoose.Schema({
  // Basic identifiers
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: [true, 'Lead ID is required'],
    index: true
  },
  
  callLogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CallLog',
    required: [true, 'Call log ID is required'],
    index: true
  },
  
  projectName: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    index: true
  },
  
  // Customer details
  customerInfo: {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Customer phone is required'],
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      landmark: String
    }
  },
  
  // Site visit details
  visitDetails: {
    preferredDate: {
      type: Date,
      required: [true, 'Preferred date is required']
    },
    preferredTimeSlot: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'anytime'],
      default: 'anytime'
    },
    preferredTime: String, // "10:00 AM", "2:30 PM", etc.
    
    duration: {
      type: Number,
      default: 60 // minutes
    },
    
    purpose: {
      type: String,
      enum: ['property_viewing', 'consultation', 'documentation', 'other'],
      default: 'property_viewing'
    },
    
    requirements: [String], // ["2BHK", "parking", "furnished", etc.]
    
    notes: String, // Special customer requirements or notes
    
    // Property specific (if applicable)
    propertyType: {
      type: String,
      enum: ['residential', 'commercial', 'plot', 'other']
    },
    
    budgetRange: {
      min: Number,
      max: Number,
      currency: { type: String, default: 'INR' }
    }
  },
  
  // Scheduling status
  status: {
    type: String,
    enum: [
      'requested',        // Customer requested during call
      'confirmed',        // Company confirmed the visit
      'scheduled',        // Specific time slot assigned
      'rescheduled',      // Time was changed
      'completed',        // Visit completed
      'cancelled_customer', // Cancelled by customer
      'cancelled_company',  // Cancelled by company
      'no_show_customer',   // Customer didn't show up
      'no_show_company'     // Company representative didn't show
    ],
    default: 'requested',
    index: true
  },
  
  // Assigned team member
  assignedTo: {
    employeeId: mongoose.Schema.Types.ObjectId,
    employeeName: String,
    employeePhone: String,
    employeeEmail: String,
    role: String // 'sales_executive', 'site_engineer', etc.
  },
  
  // Confirmation details
  confirmation: {
    confirmedAt: Date,
    confirmedBy: String, // Employee who confirmed
    confirmationMethod: {
      type: String,
      enum: ['phone', 'email', 'sms', 'whatsapp'],
      default: 'phone'
    },
    finalDateTime: Date,
    finalAddress: String
  },
  
  // Follow-up and completion
  followUp: {
    reminderSent: { type: Boolean, default: false },
    reminderSentAt: Date,
    customerNotified: { type: Boolean, default: false },
    customerNotifiedAt: Date
  },
  
  completion: {
    completedAt: Date,
    actualDuration: Number, // minutes
    outcome: {
      type: String,
      enum: [
        'interested_proceed',     // Customer wants to proceed
        'interested_thinking',    // Customer needs time to think
        'not_interested',        // Customer not interested
        'requirements_mismatch', // Requirements don't match
        'budget_mismatch',       // Budget doesn't match
        'delayed_decision'       // Customer will decide later
      ]
    },
    nextSteps: [String], // ["send_brochure", "follow_up_call", "schedule_second_visit"]
    employeeNotes: String,
    customerFeedback: String
  },
  
  // Cancellation details
  cancellation: {
    cancelledAt: Date,
    cancelledBy: String, // 'customer' or 'company'
    reason: String,
    rescheduleRequested: { type: Boolean, default: false },
    newPreferredDate: Date
  },
  
  // Integration with call data
  extractedFromCall: {
    interest_level: String, // "high", "medium", "low"
    urgency: String,       // "immediate", "within_week", "within_month"
    decision_maker: String, // "self", "spouse", "family"
    current_location: String
  },
  
  // Communication history
  communications: [{
    type: {
      type: String,
      enum: ['call', 'email', 'sms', 'whatsapp', 'in_person'],
      required: true
    },
    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      required: true
    },
    timestamp: { type: Date, default: Date.now },
    details: String,
    employeeId: String,
    status: String // 'successful', 'no_response', 'busy', etc.
  }]
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
siteVisitScheduleSchema.index({ userId: 1, projectName: 1 });
siteVisitScheduleSchema.index({ status: 1, 'visitDetails.preferredDate': 1 });
siteVisitScheduleSchema.index({ leadId: 1, status: 1 });
siteVisitScheduleSchema.index({ 'assignedTo.employeeId': 1, status: 1 });
siteVisitScheduleSchema.index({ 'confirmation.finalDateTime': 1 });

// Virtual fields
siteVisitScheduleSchema.virtual('isUpcoming').get(function() {
  if (!this.confirmation.finalDateTime) return false;
  return this.confirmation.finalDateTime > new Date() && 
         ['confirmed', 'scheduled'].includes(this.status);
});

siteVisitScheduleSchema.virtual('daysTillVisit').get(function() {
  if (!this.confirmation.finalDateTime) return null;
  const now = new Date();
  const visitDate = this.confirmation.finalDateTime;
  const diffTime = visitDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Instance methods
siteVisitScheduleSchema.methods.confirm = function(employeeName, finalDateTime, address = '') {
  this.status = 'confirmed';
  this.confirmation = {
    confirmedAt: new Date(),
    confirmedBy: employeeName,
    confirmationMethod: 'phone',
    finalDateTime: finalDateTime,
    finalAddress: address || this.customerInfo.address
  };
  
  // Add communication record
  this.communications.push({
    type: 'call',
    direction: 'outbound',
    timestamp: new Date(),
    details: `Visit confirmed for ${finalDateTime}`,
    employeeId: employeeName,
    status: 'successful'
  });
};

siteVisitScheduleSchema.methods.complete = function(outcome, duration, notes = '') {
  this.status = 'completed';
  this.completion = {
    completedAt: new Date(),
    actualDuration: duration,
    outcome: outcome,
    employeeNotes: notes
  };
};

siteVisitScheduleSchema.methods.cancel = function(reason, cancelledBy = 'company') {
  this.status = `cancelled_${cancelledBy}`;
  this.cancellation = {
    cancelledAt: new Date(),
    cancelledBy: cancelledBy,
    reason: reason
  };
};

// Static methods
siteVisitScheduleSchema.statics.getUpcomingVisits = function(employeeId = null, days = 7) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);
  
  const filter = {
    'confirmation.finalDateTime': {
      $gte: startDate,
      $lte: endDate
    },
    status: { $in: ['confirmed', 'scheduled'] }
  };
  
  if (employeeId) {
    filter['assignedTo.employeeId'] = employeeId;
  }
  
  return this.find(filter)
    .populate('leadId')
    .populate('callLogId')
    .sort({ 'confirmation.finalDateTime': 1 });
};

siteVisitScheduleSchema.statics.getVisitStats = function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

module.exports = mongoose.model('SiteVisitSchedule', siteVisitScheduleSchema);