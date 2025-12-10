const axios = require('axios');

// Bolna.ai Configuration
const BOLNA_CONFIG = {
  BASE_URL: process.env.BOLNA_API_URL || 'https://api.bolna.ai',
  API_TOKEN: process.env.ALOQA_TOKEN || 'your-bolna-token', // Using ALOQA_TOKEN from .env
  TIMEOUT: 60000, // Increased to 60 seconds
  ENDPOINTS: {
    MAKE_CALL: '/call'
  }
};

// Validate configuration
if (!BOLNA_CONFIG.API_TOKEN || BOLNA_CONFIG.API_TOKEN === 'your-bolna-token') {
  console.error('❌ ALOQA_TOKEN not found in environment variables');
}



// Create Bolna.ai axios instance
const bolnaAPI = axios.create({
  baseURL: BOLNA_CONFIG.BASE_URL,
  timeout: BOLNA_CONFIG.TIMEOUT,
  headers: {
    'Authorization': `Bearer ${BOLNA_CONFIG.API_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Request interceptor for logging
bolnaAPI.interceptors.request.use((config) => {

  return config;
});

// Response interceptor for error handling and success logging
bolnaAPI.interceptors.response.use(
  (response) => {
    console.log('✅ Bolna.ai API Success Response:', {
      status: response.status,
      message: response.data?.message,
      execution_id: response.data?.execution_id,
      call_status: response.data?.status,
      response_time: response.headers['x-response-time'] || 'unknown'
    });
    return response;
  },
  (error) => {
    const errorInfo = {
      status: error.response?.status,
      message: error.message,
      error_details: error.response?.data,
      url: error.config?.url,
      timeout: error.config?.timeout + 'ms'
    };

    // Specific error handling
    if (error.code === 'ECONNABORTED') {
      errorInfo.error_type = 'TIMEOUT';
      errorInfo.suggestion = 'API response took too long. Check network or increase timeout.';
    } else if (error.response?.status === 401) {
      errorInfo.error_type = 'UNAUTHORIZED';
      errorInfo.suggestion = 'Check ALOQA_TOKEN is valid and properly set.';
    } else if (error.response?.status === 400) {
      errorInfo.error_type = 'BAD_REQUEST';
      errorInfo.suggestion = 'Check payload format and required fields.';
    } else if (error.code === 'ENOTFOUND') {
      errorInfo.error_type = 'DNS_ERROR';
      errorInfo.suggestion = 'Check internet connection and API URL.';
    }

    console.error('❌ Bolna.ai API Error:', errorInfo);
    return Promise.reject(error);
  }
);

module.exports = {
  bolnaAPI,
  BOLNA_CONFIG
};