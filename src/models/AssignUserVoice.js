const mongoose = require('mongoose');

const assignUserVoiceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  voiceId: {
    type: String, // ElevenLabs voice ID
    required: [true, 'Voice ID is required'],
    trim: true,
    index: true
  },
  
  voiceName: {
    type: String,
    required: [true, 'Voice name is required'],
    trim: true
  },
  
  voiceProvider: {
    type: String,
    enum: ['elevenlabs'],
    default: 'elevenlabs',
    required: true
  },
  
  voiceAccent: {
    type: String,
    trim: true
  },
  
  voiceModel: {
    type: String,
    trim: true
  },
  
  projectName: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    index: true
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'deleted'],
    default: 'active'
  },
  
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound index for user + project lookups
assignUserVoiceSchema.index({ userId: 1, projectName: 1 });

// Compound index for user + voice
assignUserVoiceSchema.index({ userId: 1, voiceId: 1 });

// Index for voice lookups
assignUserVoiceSchema.index({ voiceId: 1, status: 1 });

// Virtual to get user details
assignUserVoiceSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Enable virtual fields in JSON
assignUserVoiceSchema.set('toJSON', { virtuals: true });
assignUserVoiceSchema.set('toObject', { virtuals: true });

// Pre-save middleware to handle soft delete
assignUserVoiceSchema.pre('save', function(next) {
  if (this.status === 'deleted' && !this.deletedAt) {
    this.deletedAt = new Date();
  }
  next();
});

// Static method to find active assignments
assignUserVoiceSchema.statics.findActive = function(filter = {}) {
  return this.find({ 
    ...filter, 
    status: { $ne: 'deleted' } 
  });
};

// Static method to soft delete
assignUserVoiceSchema.statics.softDelete = function(id) {
  return this.findByIdAndUpdate(
    id,
    { 
      status: 'deleted',
      deletedAt: new Date()
    },
    { new: true }
  );
};

const AssignUserVoice = mongoose.model('AssignUserVoice', assignUserVoiceSchema);

module.exports = AssignUserVoice;