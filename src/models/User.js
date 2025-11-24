const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true,
    match: [/^[0-9]{10,15}$/, 'Please enter a valid mobile number']
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  companyAddress: {
    type: String,
    required: [true, 'Company address is required'],
    trim: true,
    maxlength: [200, 'Company address cannot exceed 200 characters']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  bearerToken: {
    type: String,
    trim: true,
    default: null,
    comment: 'Bolna AI API Bearer Token for agent creation'
  },
  userId: {
    type: String,
    unique: true,
    sparse: true
  },
  isApproval: {
    type: Number,
    enum: [0, 1],
    default: 0,
    comment: '0 = Not Approved, 1 = Approved'
  },
  totalMinutes: {
    type: Number,
    default: 0,
    min: [0, 'Total minutes cannot be negative']
  },
  paymentId: {
    type: String,
    trim: true
  },
  otp: {
    type: String
  },
  otpExpires: {
    type: Date
  },
  lastLogin: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { 
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.otp;
      delete ret.__v;
      return ret;
    }
  }
});

// Generate userId before saving
userSchema.pre('save', async function(next) {
  // Generate userId if not exists
  if (!this.userId && this.isNew) {
    const count = await mongoose.model('User').countDocuments();
    this.userId = `USER${String(count + 1).padStart(6, '0')}`;
  }

  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase(), isActive: true });
};

// Static method to find user by userId
userSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId, isActive: true });
};

module.exports = mongoose.model('User', userSchema);
