const mongoose = require('mongoose');

const siteUserSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [50, 'Full name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    contact_number: {
      type: String,
      required: [true, 'Contact number is required'],
      minlength: [10, 'Contact number must be at least 10 digits'],
      maxlength: [15, 'Contact number cannot exceed 15 characters'],
    },
    project_name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [2, 'Project name must be at least 2 characters'],
      maxlength: [100, 'Project name cannot exceed 100 characters'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Client ID is required'],
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
siteUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
siteUserSchema.methods.comparePassword = async function (enteredPassword) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('SiteUser', siteUserSchema);
