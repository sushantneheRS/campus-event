const axios = require('axios');

const BASE_URL = 'https://campus-event-backend.onrender.com';

const testRoutes = async () => {
  console.log('🧪 Testing Backend Routes...\n');

  const routes = [
    { method: 'GET', path: '/api/health', description: 'Health Check' },
    { method: 'GET', path: '/api/test', description: 'Test Endpoint' },
    { method: 'POST', path: '/api/auth/register', description: 'Register User' },
    { method: 'POST', path: '/api/auth/login', description: 'Login User' },
    { method: 'GET', path: '/api/auth/me', description: 'Get Current User' },
    { method: 'GET', path: '/api/events', description: 'Get Events' },
    { method: 'GET', path: '/api/categories', description: 'Get Categories' }
  ];

  for (const route of routes) {
    try {
      console.log(`🔍 Testing: ${route.method} ${route.path}`);
      console.log(`📝 Description: ${route.description}`);
      
      const response = await axios({
        method: route.method,
        url: `${BASE_URL}${route.path}`,
        timeout: 10000,
        ...(route.method === 'POST' && {
          data: { test: true },
          headers: { 'Content-Type': 'application/json' }
        })
      });
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Response:`, response.data);
      console.log('─'.repeat(50));
      
    } catch (error) {
      console.log(`❌ Error: ${error.response?.status || 'Network Error'}`);
      if (error.response?.data) {
        console.log(`📊 Error Details:`, error.response.data);
      }
      console.log('─'.repeat(50));
    }
  }
};

// Run tests
testRoutes().catch(console.error);
