const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Debug environment variables
    console.log('🔍 Environment Check:');
    console.log('📍 NODE_ENV:', process.env.NODE_ENV);
    console.log('🔗 MONGODB_URI exists:', !!process.env.MONGODB_URI);
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/callingAgent-admin';
    console.log('🔗 Connecting to MongoDB...');
    
    const conn = await mongoose.connect(mongoUri);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;