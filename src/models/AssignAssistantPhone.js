const mongoose = require('mongoose');

const assignAssistantPhoneSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  assistantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assistant',
    required: [true, 'Assistant ID is required'],
    index: true
  },
  
  phoneId: {
    type: mongoose.Schema.Types.Mixed, // Can be ObjectId or String (for default number)
    required: [true, 'Phone Number ID is required'],
    index: true
  },
  
  projectName: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    index: true
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
assignAssistantPhoneSchema.index({ userId: 1, projectName: 1 });

// Compound index for user + assistant + phone
assignAssistantPhoneSchema.index({ userId: 1, assistantId: 1, phoneId: 1 });

// Static method to find by user and project
assignAssistantPhoneSchema.statics.findByUserAndProject = function(userId, projectName) {
  return this.find({ 
    userId, 
    projectName, 
    status: { $ne: 'deleted' },
    deletedAt: null 
  })
    .populate('assistantId', 'agentName agentType')
    .populate('phoneId', 'phoneNumber friendlyName')
    .sort({ createdAt: -1 });
};

// Static method to find all assignments by user
assignAssistantPhoneSchema.statics.findByUser = function(userId) {
  return this.find({ 
    userId, 
    status: { $ne: 'deleted' },
    deletedAt: null 
  })
    .populate('assistantId', 'agentName agentType')
    .populate('phoneId', 'phoneNumber friendlyName')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('AssignAssistantPhone', assignAssistantPhoneSchema);
