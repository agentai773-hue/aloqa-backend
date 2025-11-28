const mongoose = require('mongoose');

const SiteVisitSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },
    visitDate: {
      type: Date,
      required: true,
    },
    visitTime: {
      type: String, // HH:MM format
      required: true,
    },
    projectName: {
      type: String,
      required: true,
    },
    address: {
      type: String,
    },
    notes: {
      type: String,
    },
    extractedFromTranscript: {
      type: Boolean,
      default: false,
    },
    callHistoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CallHistory',
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled',
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding site visits by lead
SiteVisitSchema.index({ leadId: 1, createdAt: -1 });

module.exports = mongoose.model('SiteVisit', SiteVisitSchema);
