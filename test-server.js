// Simple test to check if server can start without errors
require('dotenv').config();

console.log('🧪 Testing server startup...\n');

try {
  // Test environment variables
  console.log('✅ Environment variables loaded');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   PORT: ${process.env.PORT}`);
  console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? 'Set' : 'Not set'}`);
  console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? 'Set' : 'Not set'}\n`);

  // Test imports
  console.log('🔍 Testing imports...');
  
  const express = require('express');
  console.log('✅ Express imported');
  
  const { errorHandler } = require('./middleware/errorHandler');
  console.log('✅ Error handler imported');
  
  const authRoutes = require('./routes/auth');
  console.log('✅ Auth routes imported');
  
  const userRoutes = require('./routes/users');
  console.log('✅ User routes imported');
  
  const eventRoutes = require('./routes/events');
  console.log('✅ Event routes imported');
  
  const registrationRoutes = require('./routes/registrations');
  console.log('✅ Registration routes imported');
  
  const categoryRoutes = require('./routes/categories');
  console.log('✅ Category routes imported');
  
  const notificationRoutes = require('./routes/notifications');
  console.log('✅ Notification routes imported');
  
  console.log('\n🎉 All imports successful!');
  console.log('✅ Server should start without import errors');
  
  console.log('\n📋 Next steps:');
  console.log('1. Make sure MongoDB is running');
  console.log('2. Run: npm run dev');
  console.log('3. Check: http://localhost:5000/api/health');
  
} catch (error) {
  console.error('❌ Error during testing:', error.message);
  console.error('\n🔧 Fix required before starting server');
  process.exit(1);
}
