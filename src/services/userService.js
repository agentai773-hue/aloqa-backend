const userRepository = require('../repositories/userRepository');

class UserService {
  async createUser(userData) {
    // Check if email already exists
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw { status: 400, message: 'Email already exists' };
    }

    // Validate password confirmation
    if (userData.password !== userData.confirmPassword) {
      throw { status: 400, message: 'Passwords do not match' };
    }

    // Remove confirmPassword before saving
    delete userData.confirmPassword;

    // Create user
    const user = await userRepository.create(userData);
    return user;
  }

  async getAllUsers(filters = {}) {
    const users = await userRepository.findAll(filters);
    const total = await userRepository.countUsers(filters);
    
    return {
      users,
      total,
      page: filters.page || 1,
      limit: filters.limit || 10
    };
  }

  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }
    return user;
  }

  async updateUser(id, updateData) {
    // Check if user exists
    const user = await userRepository.findById(id);
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    // If email is being updated, check if it's already taken
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await userRepository.findByEmail(updateData.email);
      if (existingUser) {
        throw { status: 400, message: 'Email already exists' };
      }
    }

    // If password is being updated, validate confirmation
    if (updateData.password && updateData.confirmPassword) {
      if (updateData.password !== updateData.confirmPassword) {
        throw { status: 400, message: 'Passwords do not match' };
      }
      delete updateData.confirmPassword;
    }

    const updatedUser = await userRepository.update(id, updateData);
    return updatedUser;
  }

  async toggleUserApproval(id, isApproval) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    const updatedUser = await userRepository.toggleApproval(id, isApproval);
    return updatedUser;
  }

  async deleteUser(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    await userRepository.delete(id);
    return { message: 'User deleted successfully' };
  }

  async getUserStats() {
    const totalUsers = await userRepository.countUsers();
    const approvedUsers = await userRepository.countUsers({ isApproval: 1 });
    const pendingUsers = await userRepository.countUsers({ isApproval: 0 });

    return {
      totalUsers,
      approvedUsers,
      pendingUsers
    };
  }
}

module.exports = new UserService();
