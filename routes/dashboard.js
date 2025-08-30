const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { catchAsync } = require('../middleware/errorHandler');
const Registration = require('../models/Registration');
const Notification = require('../models/Notification');

// @desc    Get participant dashboard data
// @route   GET /api/dashboard/participant
// @access  Private
const getParticipantDashboard = catchAsync(async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get user's registrations with full event details
    const registrations = await Registration.find({ participant: userId })
      .populate({
        path: 'event',
        select: 'title description startDate endDate venue maxAttendees status isActive'
      })
      .sort({ createdAt: -1 });

    console.log(`Found ${registrations.length} registrations for user ${userId}`);

    // Get user's notifications
    let notifications = [];
    try {
      notifications = await Notification.find({
        recipient: userId,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } }
        ]
      })
        .sort({ createdAt: -1 })
        .limit(10);
    } catch (notifError) {
      console.log('Notification fetch failed:', notifError.message);
      // Create sample notifications if none exist
      notifications = [
        {
          _id: 'sample1',
          title: 'Welcome to Campus Events!',
          message: 'Start exploring and registering for exciting events.',
          createdAt: new Date()
        }
      ];
    }

    // Process data with better filtering
    const now = new Date();
    console.log('Current time:', now);

    // Filter registrations with valid events only
    const validRegistrations = registrations.filter(reg => reg.event && reg.event.isActive !== false);
    console.log(`Valid registrations: ${validRegistrations.length}`);

    const upcoming = validRegistrations.filter(reg => {
      const eventStart = new Date(reg.event.startDate);
      const isUpcoming = eventStart > now;
      const isValidStatus = ['confirmed', 'pending', 'waitlisted'].includes(reg.status);
      console.log(`Event ${reg.event.title}: start=${eventStart}, isUpcoming=${isUpcoming}, status=${reg.status}, isValidStatus=${isValidStatus}`);
      return isUpcoming && isValidStatus;
    });

    const completed = validRegistrations.filter(reg => {
      const eventEnd = new Date(reg.event.endDate);
      const isPast = eventEnd < now;
      const isAttended = reg.status === 'attended';
      return isPast || isAttended;
    });

    const cancelled = validRegistrations.filter(reg => reg.status === 'cancelled');

    console.log(`Upcoming: ${upcoming.length}, Completed: ${completed.length}, Cancelled: ${cancelled.length}`);

    const stats = {
      totalRegistrations: validRegistrations.length,
      upcomingEvents: upcoming.length,
      completedEvents: completed.length,
      cancelledEvents: cancelled.length
    };

    res.status(200).json({
      success: true,
      data: {
        registrations: validRegistrations.slice(0, 10),
        upcomingEvents: upcoming.slice(0, 5),
        recentRegistrations: validRegistrations.slice(0, 5),
        notifications: notifications.slice(0, 5),
        stats
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    
    // Return mock data if database fails
    console.log('Database failed, returning mock data');

    const mockRegistrations = [
      {
        _id: 'mock1',
        event: {
          _id: 'event1',
          title: 'Annual Science Fair',
          description: 'Join us for the annual science fair featuring innovative projects.',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
          venue: { name: 'Main Auditorium' }
        },
        status: 'confirmed',
        registrationDate: new Date()
      },
      {
        _id: 'mock2',
        event: {
          _id: 'event2',
          title: 'Basketball Championship',
          description: 'Cheer for your favorite team in the exciting championship.',
          startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
          venue: { name: 'Sports Complex' }
        },
        status: 'confirmed',
        registrationDate: new Date()
      },
      {
        _id: 'mock3',
        event: {
          _id: 'event3',
          title: 'AI Workshop',
          description: 'Learn about artificial intelligence and machine learning.',
          startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
          venue: { name: 'Tech Center' }
        },
        status: 'pending',
        registrationDate: new Date()
      },
      {
        _id: 'mock4',
        event: {
          _id: 'event4',
          title: 'Music Concert (Past)',
          description: 'Amazing music concert that already happened.',
          startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
          venue: { name: 'Concert Hall' }
        },
        status: 'attended',
        registrationDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
      },
      {
        _id: 'mock5',
        event: {
          _id: 'event5',
          title: 'Art Exhibition (Past)',
          description: 'Beautiful art exhibition that was completed.',
          startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
          venue: { name: 'Art Gallery' }
        },
        status: 'attended',
        registrationDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
      }
    ];

    const now = new Date();
    const upcomingMock = mockRegistrations.filter(reg =>
      new Date(reg.event.startDate) > now && ['confirmed', 'pending'].includes(reg.status)
    );
    const completedMock = mockRegistrations.filter(reg =>
      new Date(reg.event.endDate) < now || reg.status === 'attended'
    );

    const mockData = {
      registrations: mockRegistrations,
      upcomingEvents: upcomingMock,
      recentRegistrations: mockRegistrations.slice(0, 5),
      notifications: [
        {
          _id: 'notif1',
          title: 'Event Reminder',
          message: 'Your event "Annual Science Fair" is starting in 7 days!',
          createdAt: new Date()
        },
        {
          _id: 'notif2',
          title: 'Registration Confirmed',
          message: 'Your registration for "Basketball Championship" has been confirmed.',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        {
          _id: 'notif3',
          title: 'New Event Available',
          message: 'Check out the new AI Workshop - registration is now open!',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        }
      ],
      stats: {
        totalRegistrations: mockRegistrations.length,
        upcomingEvents: upcomingMock.length,
        completedEvents: completedMock.length,
        cancelledEvents: 0
      }
    };

    console.log('Mock data stats:', mockData.stats);

    res.status(200).json({
      success: true,
      message: 'Using demo data (database not available)',
      data: mockData
    });
  }
});

// Simple health check for dashboard
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Dashboard API is working',
    timestamp: new Date().toISOString()
  });
});

// Create sample data for organizer
router.post('/create-organizer-data', protect, catchAsync(async (req, res) => {
  const userId = req.user.id;

  if (req.user.role !== 'organizer' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Only organizers can create organizer sample data'
    });
  }

  try {
    const Event = require('../models/Event');
    const Category = require('../models/Category');

    // Find categories
    const categories = await Category.find({ isActive: true });
    if (categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No categories available. Please create categories first.'
      });
    }

    // Clear existing events for this organizer
    await Event.deleteMany({ organizer: userId });

    // Create sample events
    const eventsToCreate = [
      {
        title: 'Tech Conference 2024',
        description: 'Annual technology conference featuring the latest innovations.',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
        organizer: userId,
        category: categories[0]._id,
        venue: {
          name: 'Convention Center',
          address: '123 Main Street',
          capacity: 500
        },
        maxAttendees: 500,
        registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: 'published',
        isPublic: true,
        isFeatured: true,
        tags: ['technology', 'conference']
      },
      {
        title: 'Digital Marketing Workshop',
        description: 'Hands-on workshop covering modern digital marketing strategies.',
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        organizer: userId,
        category: categories[Math.min(1, categories.length - 1)]._id,
        venue: {
          name: 'Training Room A',
          address: '456 Business Park',
          capacity: 50
        },
        maxAttendees: 50,
        registrationDeadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        status: 'published',
        isPublic: true,
        tags: ['marketing', 'workshop']
      },
      {
        title: 'Leadership Seminar (Draft)',
        description: 'Executive leadership seminar - still in planning.',
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        organizer: userId,
        category: categories[0]._id,
        venue: {
          name: 'Executive Conference Room',
          address: '321 Corporate Plaza',
          capacity: 30
        },
        maxAttendees: 30,
        registrationDeadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
        status: 'draft',
        isPublic: false,
        tags: ['leadership', 'seminar']
      }
    ];

    // Create the events
    const createdEvents = await Event.insertMany(eventsToCreate);

    // Create some sample registrations
    const User = require('../models/User');
    const participants = await User.find({ role: 'participant' }).limit(5);

    if (participants.length > 0) {
      const registrationsToCreate = [];

      createdEvents.forEach((event, index) => {
        if (event.status === 'published') {
          // Add 2-4 registrations per published event
          const numRegs = Math.floor(Math.random() * 3) + 2;

          for (let i = 0; i < Math.min(numRegs, participants.length); i++) {
            registrationsToCreate.push({
              event: event._id,
              participant: participants[i]._id,
              status: i === 0 ? 'pending' : 'confirmed',
              registrationDate: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000)
            });
          }
        }
      });

      if (registrationsToCreate.length > 0) {
        await Registration.insertMany(registrationsToCreate);
      }
    }

    res.status(200).json({
      success: true,
      message: `Created ${createdEvents.length} sample events with registrations`,
      data: {
        eventsCreated: createdEvents.length,
        publishedEvents: createdEvents.filter(e => e.status === 'published').length,
        draftEvents: createdEvents.filter(e => e.status === 'draft').length
      }
    });

  } catch (error) {
    console.error('Error creating organizer sample data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create organizer sample data',
      error: error.message
    });
  }
}));

// Create sample registrations for current user
router.post('/create-sample-data', protect, catchAsync(async (req, res) => {
  const userId = req.user.id;

  try {
    // Find available events
    const Event = require('../models/Event');
    const events = await Event.find({ isActive: true, status: 'published' }).limit(5);

    if (events.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No events available to register for'
      });
    }

    // Clear existing registrations for this user
    await Registration.deleteMany({ participant: userId });

    // Create sample registrations
    const registrationsToCreate = [];

    // Upcoming events (confirmed)
    if (events[0]) {
      registrationsToCreate.push({
        event: events[0]._id,
        participant: userId,
        status: 'confirmed',
        registrationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      });
    }

    if (events[1]) {
      registrationsToCreate.push({
        event: events[1]._id,
        participant: userId,
        status: 'confirmed',
        registrationDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      });
    }

    if (events[2]) {
      registrationsToCreate.push({
        event: events[2]._id,
        participant: userId,
        status: 'pending',
        registrationDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      });
    }

    // Create past events by modifying event dates
    if (events[3]) {
      events[3].startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      events[3].endDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000);
      await events[3].save();

      registrationsToCreate.push({
        event: events[3]._id,
        participant: userId,
        status: 'attended',
        registrationDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)
      });
    }

    if (events[4]) {
      events[4].startDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
      events[4].endDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000);
      await events[4].save();

      registrationsToCreate.push({
        event: events[4]._id,
        participant: userId,
        status: 'attended',
        registrationDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
      });
    }

    // Create the registrations
    const createdRegistrations = await Registration.insertMany(registrationsToCreate);

    res.status(200).json({
      success: true,
      message: `Created ${createdRegistrations.length} sample registrations`,
      data: {
        registrationsCreated: createdRegistrations.length,
        totalEvents: events.length
      }
    });

  } catch (error) {
    console.error('Error creating sample data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sample data',
      error: error.message
    });
  }
}));

// @desc    Get organizer dashboard data
// @route   GET /api/dashboard/organizer
// @access  Private/Organizer
const getOrganizerDashboard = catchAsync(async (req, res, next) => {
  try {
    const userId = req.user.id;
    const Event = require('../models/Event');

    // Get organizer's events
    const events = await Event.find({ organizer: userId })
      .populate('category', 'name color')
      .sort({ createdAt: -1 });

    console.log(`Found ${events.length} events for organizer ${userId}`);

    // Get registrations for organizer's events
    const eventIds = events.map(event => event._id);
    const registrations = await Registration.find({ event: { $in: eventIds } })
      .populate('event', 'title startDate')
      .populate('participant', 'firstName lastName email')
      .sort({ createdAt: -1 });

    console.log(`Found ${registrations.length} registrations for organizer's events`);

    // Process data
    const now = new Date();

    // Event statistics
    const upcomingEvents = events.filter(event => new Date(event.startDate) > now);
    const pastEvents = events.filter(event => new Date(event.endDate) < now);
    const draftEvents = events.filter(event => event.status === 'draft');
    const publishedEvents = events.filter(event => event.status === 'published');

    // Registration statistics
    const pendingRegistrations = registrations.filter(reg => reg.status === 'pending');
    const confirmedRegistrations = registrations.filter(reg => reg.status === 'confirmed');
    const totalAttendees = registrations.filter(reg => reg.status === 'attended').length;

    // Recent registrations (last 10)
    const recentRegistrations = registrations.slice(0, 10);

    // Popular events (by registration count)
    const eventRegistrationCounts = {};
    registrations.forEach(reg => {
      const eventId = reg.event._id.toString();
      eventRegistrationCounts[eventId] = (eventRegistrationCounts[eventId] || 0) + 1;
    });

    const popularEvents = events
      .map(event => ({
        ...event.toObject(),
        registrationCount: eventRegistrationCounts[event._id.toString()] || 0
      }))
      .sort((a, b) => b.registrationCount - a.registrationCount)
      .slice(0, 5);

    // Monthly trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRegistrations = await Registration.aggregate([
      {
        $match: {
          event: { $in: eventIds },
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    const stats = {
      totalEvents: events.length,
      upcomingEvents: upcomingEvents.length,
      pastEvents: pastEvents.length,
      draftEvents: draftEvents.length,
      publishedEvents: publishedEvents.length,
      totalRegistrations: registrations.length,
      pendingRegistrations: pendingRegistrations.length,
      confirmedRegistrations: confirmedRegistrations.length,
      totalAttendees
    };

    res.status(200).json({
      success: true,
      data: {
        events: events.slice(0, 10), // Recent 10 events
        upcomingEvents: upcomingEvents.slice(0, 5),
        recentRegistrations,
        popularEvents,
        monthlyTrends: monthlyRegistrations,
        stats,
        notifications: [] // Will be populated later
      }
    });

  } catch (error) {
    console.error('Organizer dashboard error:', error);

    // Return mock data if database fails
    const mockData = {
      events: [
        {
          _id: 'mock1',
          title: 'Tech Conference 2024',
          description: 'Annual technology conference',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
          status: 'published',
          category: { name: 'Technology', color: '#007bff' },
          venue: { name: 'Convention Center' },
          maxAttendees: 500
        },
        {
          _id: 'mock2',
          title: 'Workshop: Digital Marketing',
          description: 'Learn digital marketing strategies',
          startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
          status: 'published',
          category: { name: 'Business', color: '#28a745' },
          venue: { name: 'Training Room A' },
          maxAttendees: 50
        }
      ],
      upcomingEvents: [
        {
          _id: 'mock1',
          title: 'Tech Conference 2024',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'published'
        }
      ],
      recentRegistrations: [
        {
          _id: 'reg1',
          participant: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
          event: { title: 'Tech Conference 2024' },
          status: 'confirmed',
          createdAt: new Date()
        }
      ],
      popularEvents: [
        {
          _id: 'mock1',
          title: 'Tech Conference 2024',
          registrationCount: 45
        }
      ],
      monthlyTrends: [],
      stats: {
        totalEvents: 2,
        upcomingEvents: 1,
        pastEvents: 0,
        draftEvents: 0,
        publishedEvents: 2,
        totalRegistrations: 1,
        pendingRegistrations: 0,
        confirmedRegistrations: 1,
        totalAttendees: 0
      },
      notifications: []
    };

    res.status(200).json({
      success: true,
      message: 'Using demo data (database not available)',
      data: mockData
    });
  }
});

router.get('/participant', protect, getParticipantDashboard);
router.get('/organizer', protect, getOrganizerDashboard);

module.exports = router;
