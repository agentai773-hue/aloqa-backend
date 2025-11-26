// clients/repositories/authRepository.js
const User = require('../../models/User');

async function findUserByEmail(email) {
    console.log("dhara",email);
  return await User.findOne({ email });

  // return await User.findOne({ email: email.toLowerCase().trim() });
}

module.exports = { findUserByEmail };