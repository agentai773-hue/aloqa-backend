const Admin = require('../models/Admin');

class AdminRepository {
  async findByEmail(email) {
    return await Admin.findByEmail(email);
  }

  async findById(id) {
    return await Admin.findById(id).select('-password -refreshToken');
  }

  async create(adminData) {
    const admin = new Admin(adminData);
    return await admin.save();
  }

  async updateRefreshToken(adminId, refreshToken) {
    return await Admin.findByIdAndUpdate(
      adminId,
      { refreshToken },
      { new: true }
    );
  }

  async updateLastLogin(adminId) {
    const admin = await Admin.findById(adminId);
    if (admin) {
      return await admin.updateLastLogin();
    }
    return null;
  }

  async removeRefreshToken(adminId) {
    return await Admin.findByIdAndUpdate(
      adminId,
      { refreshToken: null },
      { new: true }
    );
  }
}

module.exports = new AdminRepository();
