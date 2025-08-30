const fs = require('fs');
const path = require('path');

const checkDependencies = () => {
  console.log('🔍 Checking backend dependencies and setup...\n');

  const checks = [
    {
      name: 'Environment file (.env)',
      check: () => fs.existsSync('.env'),
      fix: 'Create .env file from .env.example'
    },
    {
      name: 'Uploads directory',
      check: () => fs.existsSync('uploads'),
      fix: 'Create uploads directory'
    },
    {
      name: 'Logs directory',
      check: () => fs.existsSync('logs'),
      fix: 'Create logs directory'
    },
    {
      name: 'Error log file',
      check: () => fs.existsSync('logs/error.log'),
      fix: 'Create logs/error.log file'
    },
    {
      name: 'Combined log file',
      check: () => fs.existsSync('logs/combined.log'),
      fix: 'Create logs/combined.log file'
    },
    {
      name: 'Node modules',
      check: () => fs.existsSync('node_modules'),
      fix: 'Run: npm install'
    }
  ];

  let allPassed = true;

  checks.forEach(({ name, check, fix }) => {
    const passed = check();
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${name}`);
    
    if (!passed) {
      console.log(`   Fix: ${fix}`);
      allPassed = false;
    }
  });

  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('🎉 All checks passed! Backend is ready to start.');
  } else {
    console.log('⚠️  Some issues found. Please fix them before starting the server.');
  }

  console.log('\n📋 Quick Start Commands:');
  console.log('npm run dev     - Start development server');
  console.log('npm run seed    - Seed database with sample data');
  console.log('npm test        - Run tests');

  return allPassed;
};

// Run checks if called directly
if (require.main === module) {
  checkDependencies();
}

module.exports = checkDependencies;
