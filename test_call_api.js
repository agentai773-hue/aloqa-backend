const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:8080'; // Change this to your server URL
const TEST_DATA = {
  fromPhoneNumber: '+918035735888',
  phoneNumber: '9909228051',
  recipientName: 'sandeep',
  assistantId: '6931697f615555255eabd90b' // Make sure this assistant exists in your database
};

async function testMakeCall() {
  try {
    console.log('🧪 Testing Call API...');
    console.log('📋 Test Data:', TEST_DATA);
    
    const response = await axios.post(`${BASE_URL}/api/admin/calls/sample`, TEST_DATA, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_AUTH_TOKEN' // Add your actual auth token here
      },
      timeout: 30000
    });

    console.log('✅ Call API Test Success:');
    console.log('📊 Status:', response.status);
    console.log('📋 Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Call API Test Failed:');
    
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📋 Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('📡 Network Error:', error.message);
    } else {
      console.error('⚠️ Error:', error.message);
    }
  }
}

// Test individual components
async function testComponents() {
  console.log('\n🔧 Testing Individual Components...\n');
  
  // Test 1: BolnaAI service
  try {
    const BolnaAI = require('./src/admin/services/bolna.ai');
    const bolnaClient = new BolnaAI();
    
    console.log('✅ BolnaAI service loaded successfully');
    
    // Test phone number formatting
    const formattedPhone = bolnaClient.formatPhoneNumber('9909228051');
    console.log('📱 Phone formatting test:', '9909228051', '→', formattedPhone);
    
    // Test E.164 validation
    const isValid = bolnaClient.isValidE164PhoneNumber('+919909228051');
    console.log('✅ E.164 validation test:', '+919909228051', '→', isValid);
    
  } catch (error) {
    console.error('❌ BolnaAI service error:', error.message);
  }
  
  // Test 2: CallService
  try {
    const CallService = require('./src/admin/services/callService');
    const callService = new CallService();
    
    console.log('✅ CallService loaded successfully');
    
  } catch (error) {
    console.error('❌ CallService error:', error.message);
  }
  
  // Test 3: CallController
  try {
    const callController = require('./src/admin/controllers/callController');
    console.log('✅ CallController loaded successfully');
    
  } catch (error) {
    console.error('❌ CallController error:', error.message);
  }
}

// Run tests
async function runAllTests() {
  console.log('🚀 Starting Call API Tests...\n');
  
  await testComponents();
  
  console.log('\n' + '='.repeat(50));
  console.log('📞 API Test (requires running server):');
  console.log('='.repeat(50));
  
  // Uncomment the next line if your server is running
  // await testMakeCall();
  
  console.log('\n✨ Test completed!');
  console.log('\n📝 To test the full API:');
  console.log('1. Make sure your backend server is running');
  console.log('2. Update the BASE_URL and auth token in this script');
  console.log('3. Uncomment the testMakeCall() line');
  console.log('4. Run: node test_call_api.js');
}

runAllTests().catch(console.error);