// Simple test script to verify dashboard API
const express = require('express');
const app = express();

// Mock dashboard route for testing
app.get('/api/dashboard/participant', (req, res) => {
  console.log('Dashboard API called');
  
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

  const stats = {
    totalRegistrations: mockRegistrations.length,
    upcomingEvents: upcomingMock.length,
    completedEvents: completedMock.length,
    cancelledEvents: 0
  };

  console.log('Returning stats:', stats);

  res.json({
    success: true,
    message: 'Using demo data (database not available)',
    data: {
      registrations: mockRegistrations,
      upcomingEvents: upcomingMock,
      recentRegistrations: mockRegistrations.slice(0, 5),
      notifications: [
        {
          _id: 'notif1',
          title: 'Event Reminder',
          message: 'Your event "Annual Science Fair" is starting in 7 days!',
          createdAt: new Date()
        }
      ],
      stats
    }
  });
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Test URL: http://localhost:${PORT}/api/dashboard/participant`);
});
