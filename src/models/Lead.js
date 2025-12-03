const mongoose = require('mongoose');
const { PROJECTS } = require('../data/projects');

const leadSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      trim: true,
      sparse: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    contact_number: {
      type: String,
      trim: true,
      sparse: true,
    },
    call_status: {
      type: String,
      enum: ['pending', 'connected', 'not_connected', 'callback', 'completed', 'scheduled'],
      default: 'pending',
    },
    lead_type: {
      type: String,
      enum: ['pending', 'hot', 'cold', 'fake', 'connected', 'not_interested'],
    },
    project_name: {
      type: String,
      validate: {
        validator: function(value) {
          // If value exists, validate it
          if (!value) return true; // Allow empty/null
          // Case-insensitive enum validation
          const projectLower = value.toLowerCase();
          return PROJECTS.some(project => project.toLowerCase() === projectLower);
        },
        message: `project_name must be one of: ${PROJECTS.join(', ')}`
      },
      set: function(value) {
        if (!value) return value;
        // Normalize to proper case when saving
        const projectLower = value.toLowerCase();
        const matched = PROJECTS.find(project => project.toLowerCase() === projectLower);
        return matched || value;
      }
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
