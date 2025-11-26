const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: true,
      trim: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    contact_number: {
      type: String,
      required: true,
      trim: true,
    },
    call_status: {
      type: String,
      enum: ['pending', 'connected', 'not_connected', 'callback'],
      default: 'pending',
    },
    lead_type: {
      type: String,
      enum: ['pending', 'hot', 'cold', 'fake', 'connected'],
      required: true,
    },
    project_name: {
      type: String,
      //   enum: ['shilp serene', 'shilp revanta', 'cold', 'fake', 'connected'],
      default: null,
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

module.exports = mongoose.model('Lead', leadSchema);
