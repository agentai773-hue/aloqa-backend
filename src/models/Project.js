const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  projectName: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxLength: [100, 'Project name cannot exceed 100 characters']
  },
  projectStatus: {
    type: String,
    enum: ['draft', 'planning', 'in-progress', 'testing', 'on-hold', 'completed', 'cancelled'],
    default: 'draft'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  phoneNumberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PhoneNumber',
    default: null
  },
  phoneNumber: {
    type: String,
    default: null,
    trim: true
  },
  assistantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assistant',
    required: [true, 'Assistant is required for the project']
  },
  assistantName: {
    type: String,
    default: null,
    trim: true
  }
}, {
  timestamps: true // This adds createdAt and updatedAt automatically
});

// Virtual for status badge color
projectSchema.virtual('statusColor').get(function() {
  const colors = {
    'planning': 'blue',
    'in-progress': 'yellow',
    'on-hold': 'orange',
    'completed': 'green',
    'cancelled': 'red'
  };
  return colors[this.projectStatus] || 'gray';
});

// Index for faster queries
projectSchema.index({ userId: 1, createdAt: -1 });
projectSchema.index({ userId: 1, projectStatus: 1 });
projectSchema.index({ userId: 1, projectName: 'text' });

module.exports = mongoose.model('Project', projectSchema);
