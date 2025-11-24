const User = require('../models/User');

class UserRepository {
  async findAll(filters = {}) {
    const query = { isActive: true, ...filters };
    return await User.find(query).select('-password -otp').sort({ createdAt: -1 });
  }

  async findById(id) {
    return await User.findById(id).select('-password -otp');
  }

  async findByEmail(email) {
    return await User.findByEmail(email);
  }

  async findByUserId(userId) {
    return await User.findByUserId(userId);
  }

  async create(userData) {
    const user = new User(userData);
    return await user.save();
  }

  async update(id, updateData) {
    // Remove password from update if it's empty
    if (updateData.password === '' || !updateData.password) {
      delete updateData.password;
    }
    
    return await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -otp');
  }

  async toggleApproval(id, isApproval) {
    return await User.findByIdAndUpdate(
      id,
      { isApproval: isApproval },
      { new: true }
    ).select('-password -otp');
  }

  async delete(id) {
    return await User.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
  }

  async countUsers(filters = {}) {
    const query = { isActive: true, ...filters };
    return await User.countDocuments(query);
  }

  async updateLastLogin(id) {
    const user = await User.findById(id);
    if (user) {
      return await user.updateLastLogin();
    }
    return null;
  }
}

module.exports = new UserRepository();
