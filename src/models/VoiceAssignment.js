const mongoose = require('mongoose');

const voiceAssignmentSchema = new mongoose.Schema({
  // Voice Details from Bolna API
  voiceId: {
    type: String,
    required: true
  },
  
  voiceName: {
    type: String,
    required: true
  },
  
  provider: {
    type: String,
    required: true,
    enum: ['polly', 'cartesia', 'elevenlabs', 'deepgram', 'sarvam', 'smallest', 'azuretts']
  },
  
  model: {
    type: String,
    required: true
  },
  
  accent: {
    type: String,
    required: true
  },
  
  // Assignment
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Assignment status
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  
  // Timestamps
  assignedAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for performance
voiceAssignmentSchema.index({ voiceId: 1, userId: 1 }, { unique: true });
voiceAssignmentSchema.index({ userId: 1, status: 1 });
voiceAssignmentSchema.index({ provider: 1, status: 1 });

// Update the updatedAt field on save
voiceAssignmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for populating user details
voiceAssignmentSchema.virtual('userDetails', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Ensure virtual fields are serialized
voiceAssignmentSchema.set('toJSON', { virtuals: true });
voiceAssignmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('VoiceAssignment', voiceAssignmentSchema);