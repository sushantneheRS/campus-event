const axios = require('axios');

const testAPI = async () => {
  try {
    console.log('🔍 Testing API endpoints...');
    
    // Test server health
    try {
      const healthResponse = await axios.get('http://localhost:5000/api/health');
      console.log('✅ Server is running:', healthResponse.status);
    } catch (error) {
      console.log('❌ Server health check failed:', error.message);
      return;
    }
    
    // Test events endpoint
    try {
      const eventsResponse = await axios.get('http://localhost:5000/api/events');
      console.log('📊 Events API Response:');
      console.log('   Status:', eventsResponse.status);
      console.log('   Data structure:', Object.keys(eventsResponse.data));
      console.log('   Events count:', eventsResponse.data.data?.length || 0);
      
      if (eventsResponse.data.data && eventsResponse.data.data.length > 0) {
        console.log('   Sample event:', eventsResponse.data.data[0].title);
      } else {
        console.log('   ⚠️  No events found in response');
      }
    } catch (error) {
      console.log('❌ Events API failed:', error.message);
      if (error.response) {
        console.log('   Response status:', error.response.status);
        console.log('   Response data:', error.response.data);
      }
    }
    
    // Test categories endpoint
    try {
      const categoriesResponse = await axios.get('http://localhost:5000/api/categories');
      console.log('📂 Categories API Response:');
      console.log('   Status:', categoriesResponse.status);
      console.log('   Categories count:', categoriesResponse.data.data?.length || 0);
    } catch (error) {
      console.log('❌ Categories API failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testAPI();
