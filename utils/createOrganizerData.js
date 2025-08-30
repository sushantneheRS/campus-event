const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Event = require('../models/Event');
const Category = require('../models/Category');
const Registration = require('../models/Registration');

const connectDB = require('../config/database');

const createOrganizerData = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('🎪 Creating organizer sample data...');

    // Find the organizer user
    const organizer = await User.findOne({ email: 'organizer@campus.edu' });
    if (!organizer) {
      console.log('❌ Organizer user not found. Please run seed script first.');
      process.exit(1);
    }

    // Find categories
    const categories = await Category.find({ isActive: true });
    if (categories.length === 0) {
      console.log('❌ No categories found. Please create categories first.');
      process.exit(1);
    }

    console.log(`Found organizer: ${organizer.email}`);
    console.log(`Found ${categories.length} categories`);

    // Clear existing events for this organizer
    await Event.deleteMany({ organizer: organizer._id });
    console.log('🗑️ Cleared existing events for organizer');

    // Create sample events
    const eventsToCreate = [
      {
        title: 'Tech Conference 2024',
        description: 'Annual technology conference featuring the latest innovations in software development, AI, and digital transformation. Join industry leaders and experts for keynote speeches, workshops, and networking opportunities.',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), // 8 hours later
        organizer: organizer._id,
        category: categories[0]._id,
        venue: {
          name: 'Convention Center',
          address: '123 Main Street, City Center',
          capacity: 500,
          facilities: ['WiFi', 'Parking', 'Catering', 'AV Equipment']
        },
        maxAttendees: 500,
        registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: 'published',
        isPublic: true,
        isFeatured: true,
        tags: ['technology', 'conference', 'networking'],
        requirements: ['Laptop recommended', 'Business attire'],
        agenda: [
          {
            time: '09:00',
            title: 'Registration & Welcome Coffee',
            description: 'Check-in and networking'
          },
          {
            time: '10:00',
            title: 'Keynote: Future of Technology',
            description: 'Opening keynote by industry leader'
          },
          {
            time: '11:30',
            title: 'Panel: AI in Business',
            description: 'Expert panel discussion'
          }
        ]
      },
      {
        title: 'Digital Marketing Workshop',
        description: 'Hands-on workshop covering modern digital marketing strategies, social media marketing, SEO, and content creation. Perfect for entrepreneurs and marketing professionals.',
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 hours later
        organizer: organizer._id,
        category: categories[1]._id,
        venue: {
          name: 'Training Room A',
          address: '456 Business Park, Suite 200',
          capacity: 50,
          facilities: ['WiFi', 'Projector', 'Whiteboard']
        },
        maxAttendees: 50,
        registrationDeadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        status: 'published',
        isPublic: true,
        isFeatured: false,
        tags: ['marketing', 'workshop', 'business'],
        requirements: ['Laptop required', 'Basic marketing knowledge helpful']
      },
      {
        title: 'Startup Pitch Competition',
        description: 'Annual startup pitch competition where entrepreneurs present their innovative ideas to a panel of investors and industry experts. Great networking opportunity.',
        startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), // 6 hours later
        organizer: organizer._id,
        category: categories[2]._id,
        venue: {
          name: 'Innovation Hub',
          address: '789 Startup Avenue',
          capacity: 200,
          facilities: ['WiFi', 'Stage', 'Sound System', 'Catering']
        },
        maxAttendees: 200,
        registrationDeadline: new Date(Date.now() + 19 * 24 * 60 * 60 * 1000),
        status: 'published',
        isPublic: true,
        isFeatured: true,
        tags: ['startup', 'competition', 'investment'],
        requirements: ['Business plan (for participants)', 'Professional attire']
      },
      {
        title: 'Leadership Seminar (Draft)',
        description: 'Executive leadership seminar focusing on modern management techniques and team building strategies.',
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours later
        organizer: organizer._id,
        category: categories[0]._id,
        venue: {
          name: 'Executive Conference Room',
          address: '321 Corporate Plaza',
          capacity: 30,
          facilities: ['WiFi', 'Catering', 'AV Equipment']
        },
        maxAttendees: 30,
        registrationDeadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
        status: 'draft',
        isPublic: false,
        isFeatured: false,
        tags: ['leadership', 'management', 'seminar']
      },
      {
        title: 'Past Event: Web Development Bootcamp',
        description: 'Intensive web development bootcamp that was completed last month.',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), // 6 hours later
        organizer: organizer._id,
        category: categories[0]._id,
        venue: {
          name: 'Tech Lab',
          address: '555 Developer Street',
          capacity: 40,
          facilities: ['WiFi', 'Computers', 'Projector']
        },
        maxAttendees: 40,
        registrationDeadline: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000),
        status: 'completed',
        isPublic: true,
        isFeatured: false,
        tags: ['web development', 'bootcamp', 'coding']
      }
    ];

    // Create the events
    const createdEvents = await Event.insertMany(eventsToCreate);
    console.log(`✅ Created ${createdEvents.length} sample events for organizer`);

    // Create some sample registrations for the events
    const participants = await User.find({ role: 'participant' }).limit(10);
    if (participants.length > 0) {
      const registrationsToCreate = [];
      
      // Add registrations for published events
      const publishedEvents = createdEvents.filter(event => event.status === 'published');
      
      publishedEvents.forEach((event, eventIndex) => {
        // Add 3-8 registrations per event
        const numRegistrations = Math.floor(Math.random() * 6) + 3;
        
        for (let i = 0; i < Math.min(numRegistrations, participants.length); i++) {
          const participant = participants[i];
          const statuses = ['confirmed', 'pending', 'confirmed', 'confirmed']; // More confirmed than pending
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          
          registrationsToCreate.push({
            event: event._id,
            participant: participant._id,
            status: status,
            registrationDate: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000), // Random date in last 10 days
            additionalInfo: `Registration for ${event.title}`,
            emergencyContact: {
              name: 'Emergency Contact',
              phone: '+1-555-0123',
              relationship: 'Family'
            }
          });
        }
      });

      if (registrationsToCreate.length > 0) {
        const createdRegistrations = await Registration.insertMany(registrationsToCreate);
        console.log(`✅ Created ${createdRegistrations.length} sample registrations`);
      }
    }

    // Display summary
    const now = new Date();
    const upcoming = createdEvents.filter(event => new Date(event.startDate) > now);
    const past = createdEvents.filter(event => new Date(event.endDate) < now);
    const published = createdEvents.filter(event => event.status === 'published');
    const draft = createdEvents.filter(event => event.status === 'draft');

    console.log('\n📊 Organizer Data Summary:');
    console.log(`Total Events Created: ${createdEvents.length}`);
    console.log(`Upcoming Events: ${upcoming.length}`);
    console.log(`Past Events: ${past.length}`);
    console.log(`Published Events: ${published.length}`);
    console.log(`Draft Events: ${draft.length}`);
    
    console.log('\n🎯 Now login as organizer@campus.edu to see the organizer dashboard!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating organizer data:', error);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  createOrganizerData();
}

module.exports = createOrganizerData;
