const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Category = require('../models/Category');
const Event = require('../models/Event');

const connectDB = require('../config/database');

const createSampleEvents = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('🌱 Creating sample events...');

    // Find or create admin user
    let admin = await User.findOne({ email: 'admin@campus.edu' });
    if (!admin) {
      admin = await User.create({
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

    // Find or create organizer
    let organizer = await User.findOne({ email: 'organizer@campus.edu' });
    if (!organizer) {
      organizer = await User.create({
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

    // Create categories
    const categories = [
      { name: 'Academic', description: 'Academic events and workshops', color: '#007bff' },
      { name: 'Sports', description: 'Sports and fitness events', color: '#28a745' },
      { name: 'Cultural', description: 'Cultural and arts events', color: '#dc3545' },
      { name: 'Technology', description: 'Tech talks and workshops', color: '#6f42c1' },
      { name: 'Social', description: 'Social gatherings and networking', color: '#fd7e14' }
    ];

    const createdCategories = [];
    for (const categoryData of categories) {
      let category = await Category.findOne({ name: categoryData.name });
      if (!category) {
        category = await Category.create(categoryData);
        console.log('📂 Created category:', category.name);
      }
      createdCategories.push(category);
    }

    // Create sample events
    const sampleEvents = [
      {
        title: 'Annual Science Fair',
        description: 'Join us for the annual science fair featuring innovative projects from students across all departments. Witness groundbreaking research and creative solutions to real-world problems.',
        category: createdCategories[0]._id, // Academic
        organizer: organizer._id,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), // 6 hours later
        venue: {
          name: 'Main Auditorium',
          address: '123 Campus Drive, University City',
          capacity: 500
        },
        maxAttendees: 500,
        registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: 'published',
        isPublic: true,
        isActive: true,
        isFeatured: true,
        tags: ['science', 'research', 'innovation']
      },
      {
        title: 'Basketball Championship Finals',
        description: 'Cheer for your favorite team in the exciting basketball championship finals. Experience the thrill of competitive sports and school spirit.',
        category: createdCategories[1]._id, // Sports
        organizer: organizer._id,
        startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours later
        venue: {
          name: 'Sports Complex',
          address: '456 Athletic Way, University City',
          capacity: 1000
        },
        maxAttendees: 1000,
        registrationDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: 'published',
        isPublic: true,
        isActive: true,
        isFeatured: true,
        tags: ['basketball', 'sports', 'championship']
      },
      {
        title: 'Cultural Night: Diversity Celebration',
        description: 'Celebrate the rich diversity of our campus community with performances, food, and cultural exhibitions from around the world.',
        category: createdCategories[2]._id, // Cultural
        organizer: organizer._id,
        startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 hours later
        venue: {
          name: 'Student Center',
          address: '789 Student Plaza, University City',
          capacity: 300
        },
        maxAttendees: 300,
        registrationDeadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        status: 'published',
        isPublic: true,
        isActive: true,
        isFeatured: false,
        tags: ['culture', 'diversity', 'international']
      },
      {
        title: 'AI & Machine Learning Workshop',
        description: 'Learn about the latest trends in artificial intelligence and machine learning. Hands-on workshop with industry experts.',
        category: createdCategories[3]._id, // Technology
        organizer: organizer._id,
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), // 8 hours later
        venue: {
          name: 'Computer Science Building',
          address: '321 Tech Avenue, University City',
          capacity: 100
        },
        maxAttendees: 100,
        registrationDeadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        status: 'published',
        isPublic: true,
        isActive: true,
        isFeatured: true,
        tags: ['AI', 'machine learning', 'technology', 'workshop']
      },
      {
        title: 'Alumni Networking Mixer',
        description: 'Connect with successful alumni and expand your professional network. Great opportunity for career guidance and mentorship.',
        category: createdCategories[4]._id, // Social
        organizer: organizer._id,
        startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks from now
        endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours later
        venue: {
          name: 'Alumni Hall',
          address: '654 Alumni Drive, University City',
          capacity: 200
        },
        maxAttendees: 200,
        registrationDeadline: new Date(Date.now() + 19 * 24 * 60 * 60 * 1000),
        status: 'published',
        isPublic: true,
        isActive: true,
        isFeatured: false,
        tags: ['networking', 'alumni', 'career', 'professional']
      },
      {
        title: 'Spring Music Festival',
        description: 'Enjoy live performances from local bands and student musicians. Food trucks and activities for all ages.',
        category: createdCategories[2]._id, // Cultural
        organizer: organizer._id,
        startDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 4 weeks from now
        endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), // 6 hours later
        venue: {
          name: 'Campus Green',
          address: '100 Campus Green, University City',
          capacity: 2000
        },
        maxAttendees: 2000,
        registrationDeadline: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000),
        status: 'published',
        isPublic: true,
        isActive: true,
        isFeatured: true,
        tags: ['music', 'festival', 'outdoor', 'entertainment']
      }
    ];

    // Create events
    for (const eventData of sampleEvents) {
      const existingEvent = await Event.findOne({ title: eventData.title });
      if (!existingEvent) {
        const event = await Event.create(eventData);
        console.log('🎉 Created event:', event.title);
      } else {
        console.log('⚠️  Event already exists:', eventData.title);
      }
    }

    console.log('✅ Sample events created successfully!');
    
    // Show summary
    const totalEvents = await Event.countDocuments();
    const publishedEvents = await Event.countDocuments({ status: 'published', isActive: true });
    
    console.log(`📊 Database Summary:`);
    console.log(`   Total Events: ${totalEvents}`);
    console.log(`   Published Events: ${publishedEvents}`);
    console.log(`   Categories: ${createdCategories.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating sample events:', error);
    process.exit(1);
  }
};

// Run the script
createSampleEvents();
