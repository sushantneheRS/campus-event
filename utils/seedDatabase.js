const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Category = require('../models/Category');
const Event = require('../models/Event');

const connectDB = require('../config/database');

const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('🌱 Starting database seeding...');

    // Clear existing data (optional - uncomment if needed)
    // await User.deleteMany({});
    // await Category.deleteMany({});
    // await Event.deleteMany({});
    // console.log('🗑️  Cleared existing data');

    // Create admin user
    const adminExists = await User.findOne({ email: 'admin@campus.edu' });
    if (!adminExists) {
      const admin = await User.create({
        firstName: 'System',
        lastName: 'Administrator',
        email: 'admin@campus.edu',
        password: 'Admin123!',
        role: 'admin',
        department: 'IT',
        isEmailVerified: true
      });
      console.log('👤 Created admin user:', admin.email);
    }

    // Create sample organizer
    const organizerExists = await User.findOne({ email: 'organizer@campus.edu' });
    if (!organizerExists) {
      const organizer = await User.create({
        firstName: 'Event',
        lastName: 'Organizer',
        email: 'organizer@campus.edu',
        password: 'Organizer123!',
        role: 'organizer',
        department: 'Student Affairs',
        employeeId: 'EMP001',
        isEmailVerified: true
      });
      console.log('👤 Created organizer user:', organizer.email);
    }

    // Create sample participant
    const participantExists = await User.findOne({ email: 'student@campus.edu' });
    if (!participantExists) {
      const participant = await User.create({
        firstName: 'John',
        lastName: 'Student',
        email: 'student@campus.edu',
        password: 'Student123!',
        role: 'participant',
        department: 'Computer Science',
        studentId: 'STU001',
        isEmailVerified: true
      });
      console.log('👤 Created participant user:', participant.email);
    }

    // Create sample categories
    const categories = [
      {
        name: 'Academic',
        description: 'Academic events, lectures, and workshops',
        color: '#007bff',
        icon: 'book'
      },
      {
        name: 'Sports',
        description: 'Sports events and competitions',
        color: '#28a745',
        icon: 'trophy'
      },
      {
        name: 'Cultural',
        description: 'Cultural events and celebrations',
        color: '#dc3545',
        icon: 'music-note'
      },
      {
        name: 'Social',
        description: 'Social gatherings and networking events',
        color: '#ffc107',
        icon: 'people'
      }
    ];

    const admin = await User.findOne({ email: 'admin@campus.edu' });
    
    for (const categoryData of categories) {
      const categoryExists = await Category.findOne({ name: categoryData.name });
      if (!categoryExists) {
        await Category.create({
          ...categoryData,
          createdBy: admin._id
        });
        console.log(`📂 Created category: ${categoryData.name}`);
      }
    }

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📋 Default Users Created:');
    console.log('Admin: admin@campus.edu / Admin123!');
    console.log('Organizer: organizer@campus.edu / Organizer123!');
    console.log('Student: student@campus.edu / Student123!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
