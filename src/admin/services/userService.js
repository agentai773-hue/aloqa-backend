const userRepository = require('../repositories/userRepository');
const { generateVerificationToken, sendVerificationEmail } = require('../../utils/emailService');
const Assistant = require('../../models/Assistant');
const PhoneNumber = require('../../models/PhoneNumber');

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

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Add verification data to user
    userData.verificationToken = verificationToken;
    userData.verificationTokenExpires = verificationTokenExpires;
    userData.isActive = 0; // Not active until email verified

    // Create user
    const user = await userRepository.create(userData);

    // Send verification email - REQUIRED (will throw error if fails)
    await sendVerificationEmail(user, verificationToken);

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

    // Get counts of related data before deletion
    const assistantsCount = await Assistant.countDocuments({ userId: user.userId });
    const phoneNumbersCount = await PhoneNumber.countDocuments({ userId: user.userId });

    // Delete all related data (cascading delete)
    // Delete all assistants created by this user
    if (assistantsCount > 0) {
      await Assistant.deleteMany({ userId: user.userId });
    }

    // Delete all phone numbers assigned to this user
    if (phoneNumbersCount > 0) {
      await PhoneNumber.deleteMany({ userId: user.userId });
    }

    // Finally delete the user
    await userRepository.delete(id);

    return { 
      message: 'User deleted successfully',
      deletedData: {
        assistants: assistantsCount,
        phoneNumbers: phoneNumbersCount
      }
    };
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

  async manuallyVerifyUser(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    if (user.isActive === 1) {
      throw { status: 400, message: 'User email is already verified' };
    }

    // Set isActive to 1 and clear verification token
    const updateData = {
      isActive: 1,
      verificationToken: null,
      verificationTokenExpires: null
    };

    const updatedUser = await userRepository.update(id, updateData);

    // Send welcome email
    const { sendWelcomeEmail } = require('../../utils/emailService');
    try {
      await sendWelcomeEmail(updatedUser);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't throw - user is verified even if email fails
    }

    return updatedUser;
  }
}

module.exports = new UserService();
