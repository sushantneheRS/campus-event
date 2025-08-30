// Mock data for development when database is not available
const mockCategories = [
  {
    _id: '507f1f77bcf86cd799439011',
    name: 'Academic',
    description: 'Academic events and workshops',
    color: '#007bff',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '507f1f77bcf86cd799439012',
    name: 'Sports',
    description: 'Sports and fitness events',
    color: '#28a745',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '507f1f77bcf86cd799439013',
    name: 'Cultural',
    description: 'Cultural and arts events',
    color: '#dc3545',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '507f1f77bcf86cd799439014',
    name: 'Technology',
    description: 'Tech talks and workshops',
    color: '#6f42c1',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '507f1f77bcf86cd799439015',
    name: 'Social',
    description: 'Social gatherings and networking',
    color: '#fd7e14',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const mockEvents = [
  {
    _id: '507f1f77bcf86cd799439021',
    title: 'Annual Science Fair',
    description: 'Join us for the annual science fair featuring innovative projects from students across all departments. Witness groundbreaking research and creative solutions to real-world problems.',
    category: {
      _id: '507f1f77bcf86cd799439011',
      name: 'Academic',
      color: '#007bff'
    },
    organizer: {
      _id: '507f1f77bcf86cd799439001',
      firstName: 'Event',
      lastName: 'Organizer'
    },
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), // 6 hours later
    venue: {
      name: 'Main Auditorium',
      address: '123 Campus Drive, University City',
      capacity: 500
    },
    maxAttendees: 500,
    availableSpots: 450,
    registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    status: 'published',
    isPublic: true,
    isActive: true,
    isFeatured: true,
    tags: ['science', 'research', 'innovation'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '507f1f77bcf86cd799439022',
    title: 'Basketball Championship Finals',
    description: 'Cheer for your favorite team in the exciting basketball championship finals. Experience the thrill of competitive sports and school spirit.',
    category: {
      _id: '507f1f77bcf86cd799439012',
      name: 'Sports',
      color: '#28a745'
    },
    organizer: {
      _id: '507f1f77bcf86cd799439001',
      firstName: 'Event',
      lastName: 'Organizer'
    },
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours later
    venue: {
      name: 'Sports Complex',
      address: '456 Athletic Way, University City',
      capacity: 1000
    },
    maxAttendees: 1000,
    availableSpots: 850,
    registrationDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    status: 'published',
    isPublic: true,
    isActive: true,
    isFeatured: true,
    tags: ['basketball', 'sports', 'championship'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '507f1f77bcf86cd799439023',
    title: 'Cultural Night: Diversity Celebration',
    description: 'Celebrate the rich diversity of our campus community with performances, food, and cultural exhibitions from around the world.',
    category: {
      _id: '507f1f77bcf86cd799439013',
      name: 'Cultural',
      color: '#dc3545'
    },
    organizer: {
      _id: '507f1f77bcf86cd799439001',
      firstName: 'Event',
      lastName: 'Organizer'
    },
    startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 hours later
    venue: {
      name: 'Student Center',
      address: '789 Student Plaza, University City',
      capacity: 300
    },
    maxAttendees: 300,
    availableSpots: 275,
    registrationDeadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    status: 'published',
    isPublic: true,
    isActive: true,
    isFeatured: false,
    tags: ['culture', 'diversity', 'international'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '507f1f77bcf86cd799439024',
    title: 'AI & Machine Learning Workshop',
    description: 'Learn about the latest trends in artificial intelligence and machine learning. Hands-on workshop with industry experts.',
    category: {
      _id: '507f1f77bcf86cd799439014',
      name: 'Technology',
      color: '#6f42c1'
    },
    organizer: {
      _id: '507f1f77bcf86cd799439001',
      firstName: 'Event',
      lastName: 'Organizer'
    },
    startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), // 8 hours later
    venue: {
      name: 'Computer Science Building',
      address: '321 Tech Avenue, University City',
      capacity: 100
    },
    maxAttendees: 100,
    availableSpots: 85,
    registrationDeadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    status: 'published',
    isPublic: true,
    isActive: true,
    isFeatured: true,
    tags: ['AI', 'machine learning', 'technology', 'workshop'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '507f1f77bcf86cd799439025',
    title: 'Alumni Networking Mixer',
    description: 'Connect with successful alumni and expand your professional network. Great opportunity for career guidance and mentorship.',
    category: {
      _id: '507f1f77bcf86cd799439015',
      name: 'Social',
      color: '#fd7e14'
    },
    organizer: {
      _id: '507f1f77bcf86cd799439001',
      firstName: 'Event',
      lastName: 'Organizer'
    },
    startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks from now
    endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours later
    venue: {
      name: 'Alumni Hall',
      address: '654 Alumni Drive, University City',
      capacity: 200
    },
    maxAttendees: 200,
    availableSpots: 180,
    registrationDeadline: new Date(Date.now() + 19 * 24 * 60 * 60 * 1000),
    status: 'published',
    isPublic: true,
    isActive: true,
    isFeatured: false,
    tags: ['networking', 'alumni', 'career', 'professional'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '507f1f77bcf86cd799439026',
    title: 'Spring Music Festival',
    description: 'Enjoy live performances from local bands and student musicians. Food trucks and activities for all ages.',
    category: {
      _id: '507f1f77bcf86cd799439013',
      name: 'Cultural',
      color: '#dc3545'
    },
    organizer: {
      _id: '507f1f77bcf86cd799439001',
      firstName: 'Event',
      lastName: 'Organizer'
    },
    startDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 4 weeks from now
    endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), // 6 hours later
    venue: {
      name: 'Campus Green',
      address: '100 Campus Green, University City',
      capacity: 2000
    },
    maxAttendees: 2000,
    availableSpots: 1850,
    registrationDeadline: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000),
    status: 'published',
    isPublic: true,
    isActive: true,
    isFeatured: true,
    tags: ['music', 'festival', 'outdoor', 'entertainment'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

module.exports = {
  mockCategories,
  mockEvents
};
