const mongoose = require('mongoose');

const phoneNumberSchema = new mongoose.Schema({
  // Bolna Phone Number ID
  bolnaPhoneId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Phone Number Details
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  
  country: {
    type: String,
    required: true,
    enum: ['US', 'IN']
  },
  
  // Assignment
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  agentId: {
    type: String, // Bolna Agent ID
    default: null
  },
  
  // Bolna Details
  telephonyProvider: {
    type: String,
    enum: ['twilio', 'plivo', 'vonage', 'telnyx']
  },
  
  telephonySid: {
    type: String
  },
  
  price: {
    type: Number,
    required: true
  },
  
  bolnaOwned: {
    type: Boolean,
    default: true
  },
  
  renewal: {
    type: Boolean,
    default: true
  },
  
  paymentUuid: {
    type: String
  },
  
  // Status
  status: {
    type: String,
    enum: ['available', 'assigned', 'deleted'],
    default: 'available'
  },
  
  // Additional Info
  region: String,
  locality: String,
  postalCode: String,
  friendlyName: String,
  
  // Timestamps
  purchasedAt: {
    type: Date,
    default: Date.now
  },
  
  assignedAt: {
    type: Date,
    default: null
  },
  
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for quick lookups
// phoneNumber already has unique index, no need for additional index
phoneNumberSchema.index({ userId: 1 });
phoneNumberSchema.index({ status: 1 });

module.exports = mongoose.model('PhoneNumber', phoneNumberSchema);
