const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    contact_number: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    call_status: {
      type: String,
      enum: ['pending', 'initiating', 'ringing', 'in_progress', 'completed', 'no_answer', 'failed', 'voicemail', 'busy', 'cancelled'],
      default: 'pending',
    },
    lead_type: {
      type: String,
      enum: ['pending', 'hot', 'cold', 'fake', 'connected', 'not_interested'],
      default: 'cold',
    },
    project_name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true
    },
    // Scheduled call time - next time this lead should be called
    scheduled_call_time: {
      type: Date,
      default: null,
    },
    // Reason for next scheduled call (extracted from transcript)
    scheduled_call_reason: {
      type: String,
      default: null,
    },
    // Number of times this lead has been called
    call_attempt_count: {
      type: Number,
      default: 0,
    },
    // Maximum retry attempts allowed
    max_retry_attempts: {
      type: Number,
      default: 3,
    },
    // Call disposition after the call
    call_disposition: {
      type: String,
      enum: ['interested', 'not_interested', 'site_visit_scheduled', 'callback_requested', 'wrong_number', 'language_barrier', 'voicemail', 'no_answer'],
      default: null,
    },
    // Last time a call was attempted
    last_call_attempt_time: {
      type: Date,
      default: null,
    },
    // Next scheduled call time
    next_scheduled_call_time: {
      type: Date,
      default: null,
    },
    // Track when auto-call last attempted (for debugging)
    last_auto_call_attempt: {
      type: Date,
      default: null,
    },
    // Track if this lead has EVER been called (once called, never call again)
    has_been_called: {
      type: Boolean,
      default: false,
      index: true,
    },
    deleted_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Index for soft delete queries
leadSchema.index({ deleted_at: 1 });
// Index for scheduled calls query
leadSchema.index({ scheduled_call_time: 1, call_status: 1 });
// Index for auto-call query (lead_type=pending + has_been_called=false + not deleted)
leadSchema.index({ lead_type: 1, has_been_called: 1, deleted_at: 1 });

module.exports = mongoose.model('Lead', leadSchema);
