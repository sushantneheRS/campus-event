const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

const connectDB = require('../config/database');

const createSampleRegistrations = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('🎫 Creating sample registrations...');

    // Find the participant user
    const participant = await User.findOne({ email: 'student@campus.edu' });
    if (!participant) {
      console.log('❌ Participant user not found. Please run seed script first.');
      process.exit(1);
    }

    // Find all events
    const events = await Event.find({ isActive: true, status: 'published' });
    if (events.length === 0) {
      console.log('❌ No events found. Please create events first.');
      process.exit(1);
    }

    console.log(`Found ${events.length} events to register for`);

    // Clear existing registrations for this user
    await Registration.deleteMany({ participant: participant._id });
    console.log('🗑️ Cleared existing registrations');

    // Create sample registrations
    const registrationsToCreate = [
      {
        event: events[0]._id, // First event - confirmed, upcoming
        participant: participant._id,
        status: 'confirmed',
        registrationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        confirmationDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        additionalInfo: 'Looking forward to this event!',
        emergencyContact: {
          name: 'Jane Student',
          phone: '+1-555-0123',
          relationship: 'Sister'
        }
      },
      {
        event: events[1]._id, // Second event - confirmed, upcoming
        participant: participant._id,
        status: 'confirmed',
        registrationDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        confirmationDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        additionalInfo: 'Excited for the championship!'
      },
      {
        event: events[2]._id, // Third event - pending
        participant: participant._id,
        status: 'pending',
        registrationDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        additionalInfo: 'Hope to get confirmed soon'
      }
    ];

    // Add past events if available
    if (events.length > 3) {
      // Create a past event by modifying dates
      const pastEvent = events[3];
      pastEvent.startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      pastEvent.endDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000); // 3 hours later
      await pastEvent.save();

      registrationsToCreate.push({
        event: pastEvent._id,
        participant: participant._id,
        status: 'attended',
        registrationDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 days ago
        confirmationDate: new Date(Date.now() - 34 * 24 * 60 * 60 * 1000),
        additionalInfo: 'Great event!',
        attendanceStatus: {
          checkedIn: true,
          checkedInAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          checkedOut: true,
          checkedOutAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000)
        },
        feedback: {
          rating: 5,
          comment: 'Excellent event, learned a lot!',
          submittedAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
          wouldRecommend: true,
          categories: {
            content: 5,
            organization: 4,
            venue: 5,
            overall: 5
          }
        }
      });
    }

    if (events.length > 4) {
      // Another past event
      const pastEvent2 = events[4];
      pastEvent2.startDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000); // 15 days ago
      pastEvent2.endDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000); // 2 hours later
      await pastEvent2.save();

      registrationsToCreate.push({
        event: pastEvent2._id,
        participant: participant._id,
        status: 'attended',
        registrationDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        confirmationDate: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000),
        additionalInfo: 'Another great experience',
        attendanceStatus: {
          checkedIn: true,
          checkedInAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          checkedOut: true,
          checkedOutAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000)
        },
        feedback: {
          rating: 4,
          comment: 'Good event, well organized',
          submittedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          wouldRecommend: true,
          categories: {
            content: 4,
            organization: 5,
            venue: 4,
            overall: 4
          }
        }
      });
    }

    // Create the registrations
    const createdRegistrations = await Registration.insertMany(registrationsToCreate);
    
    console.log(`✅ Created ${createdRegistrations.length} sample registrations`);
    
    // Display summary
    const now = new Date();
    const upcoming = createdRegistrations.filter(reg => {
      const event = events.find(e => e._id.toString() === reg.event.toString());
      return event && new Date(event.startDate) > now && ['confirmed', 'pending'].includes(reg.status);
    });
    
    const completed = createdRegistrations.filter(reg => {
      const event = events.find(e => e._id.toString() === reg.event.toString());
      return event && (new Date(event.endDate) < now || reg.status === 'attended');
    });

    console.log('\n📊 Registration Summary:');
    console.log(`Total Registrations: ${createdRegistrations.length}`);
    console.log(`Upcoming Events: ${upcoming.length}`);
    console.log(`Completed Events: ${completed.length}`);
    console.log(`Pending Approvals: ${createdRegistrations.filter(r => r.status === 'pending').length}`);
    
    console.log('\n🎯 Now login as student@campus.edu to see the dashboard with real data!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating sample registrations:', error);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  createSampleRegistrations();
}

module.exports = createSampleRegistrations;
