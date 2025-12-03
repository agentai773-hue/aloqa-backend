const User = require('../../models/User');

class UserRepository {
  async findAll(filters = {}) {
    const { page = 1, limit = 10, search, status, approval, ...otherFilters } = filters;
    
    // Build query object
    const query = { ...otherFilters };
    
    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { mobile: searchRegex },
        { companyName: searchRegex }
      ];
    }
    
    // Add status filter
    if (status === 'verified') {
      query.isActive = 1;
    } else if (status === 'pending') {
      query.isActive = 0;
    }
    
    // Add approval filter
    if (approval === 'approved') {
      query.isApproval = 1;
    } else if (approval === 'pending') {
      query.isApproval = 0;
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    return await User.find(query)
      .select('-password -otp')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
  }

  async countUsers(filters = {}) {
    const { search, status, approval, ...otherFilters } = filters;
    
    // Build query object
    const query = { ...otherFilters };
    
    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { mobile: searchRegex },
        { companyName: searchRegex }
      ];
    }
    
    // Add status filter
    if (status === 'verified') {
      query.isActive = 1;
    } else if (status === 'pending') {
      query.isActive = 0;
    }
    
    // Add approval filter
    if (approval === 'approved') {
      query.isApproval = 1;
    } else if (approval === 'pending') {
      query.isApproval = 0;
    }
    
    return await User.countDocuments(query);
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
    // Actually delete from database instead of soft delete
    return await User.findByIdAndDelete(id);
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
