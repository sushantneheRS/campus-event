const Event = require('../models/Event');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const {
  getPagination,
  buildPaginationResponse,
  buildSortObject,
  buildSearchQuery
} = require('../utils/helpers');
const { uploadSingle, resizeEventImage } = require('../utils/fileUpload');
const { mockEvents, mockCategories } = require('../utils/mockData');

// @desc    Get all events
// @route   GET /api/events
// @access  Public
const getEvents = catchAsync(async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit);
    const {
      search,
      category,
      startDate,
      endDate,
      organizer,
      status,
      isFeatured,
      sortBy,
      sortOrder
    } = req.query;

    // Build query
    const query = { isActive: true };

    // Only show public events for non-authenticated users
    if (!req.user) {
      query.isPublic = true;
      query.status = 'published';
    }

    if (search) {
      const searchQuery = buildSearchQuery(search, ['title', 'description', 'venue.name']);
      Object.assign(query, searchQuery);
    }

    if (category) query.category = category;
    if (organizer) query.organizer = organizer;
    if (status) query.status = status;
    if (isFeatured === 'true') query.isFeatured = true;

    // Date range filter
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    // Build sort
    const sort = buildSortObject(sortBy || 'startDate', sortOrder || 'asc');

    // Execute query
    const events = await Event.find(query)
      .populate('category', 'name color')
      .populate('organizer', 'firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Event.countDocuments(query);

    const response = buildPaginationResponse(events, total, page, limit);

    res.status(200).json({
      success: true,
      ...response
    });
  } catch (error) {
    console.log('Database error, using mock data:', error.message);

    // Fallback to mock data if database is not available
    let filteredEvents = [...mockEvents];

    // Apply filters to mock data
    const { search, category, startDate, endDate, isFeatured, sortBy, sortOrder } = req.query;

    if (search) {
      const searchLower = search.toLowerCase();
      filteredEvents = filteredEvents.filter(event =>
        event.title.toLowerCase().includes(searchLower) ||
        event.description.toLowerCase().includes(searchLower) ||
        event.venue.name.toLowerCase().includes(searchLower)
      );
    }

    if (category) {
      filteredEvents = filteredEvents.filter(event => event.category._id === category);
    }

    if (isFeatured === 'true') {
      filteredEvents = filteredEvents.filter(event => event.isFeatured);
    }

    // Apply date filters
    if (startDate) {
      const start = new Date(startDate);
      filteredEvents = filteredEvents.filter(event => new Date(event.startDate) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      filteredEvents = filteredEvents.filter(event => new Date(event.startDate) <= end);
    }

    // Apply sorting
    if (sortBy === 'title') {
      filteredEvents.sort((a, b) => {
        const comparison = a.title.localeCompare(b.title);
        return sortOrder === 'desc' ? -comparison : comparison;
      });
    } else if (sortBy === 'startDate') {
      filteredEvents.sort((a, b) => {
        const comparison = new Date(a.startDate) - new Date(b.startDate);
        return sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    // Apply pagination
    const { page: currentPage, limit: pageLimit } = getPagination(req.query.page, req.query.limit);
    const startIndex = (currentPage - 1) * pageLimit;
    const endIndex = startIndex + pageLimit;
    const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

    const response = buildPaginationResponse(paginatedEvents, filteredEvents.length, currentPage, pageLimit);

    res.status(200).json({
      success: true,
      message: 'Using demo data (database not available)',
      ...response
    });
  }
});

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
const getEvent = catchAsync(async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('category', 'name color')
      .populate('organizer', 'firstName lastName email')
      .populate('coOrganizers', 'firstName lastName');

    if (!event) {
      return next(new AppError('Event not found', 404));
    }

    // Check if user can view this event
    if (!event.isPublic && (!req.user || req.user.role === 'participant')) {
      return next(new AppError('Event not found', 404));
    }

    // Get registration count
    const Registration = require('../models/Registration');
    const registrationCount = await Registration.countDocuments({
      event: req.params.id,
      status: { $in: ['confirmed', 'attended'] }
    });

    const waitlistCount = await Registration.countDocuments({
      event: req.params.id,
      status: 'waitlisted'
    });

    // Add registration counts to event object
    const eventWithCounts = {
      ...event.toObject(),
      registrationCount,
      waitlistCount
    };

    // Increment view count
    await event.incrementViews(true);

    res.status(200).json({
      success: true,
      data: eventWithCounts
    });

  } catch (error) {
    console.error('Error fetching event:', error);

    // If database fails, provide mock data for the requested ID
    const mockEvent = {
      _id: req.params.id,
      title: 'Sample Event',
      description: 'This is a sample event for demonstration purposes. The actual event data could not be loaded from the database.',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      venue: {
        name: 'Sample Venue',
        address: '123 Sample Street, Sample City',
        capacity: 100,
        facilities: ['WiFi', 'Parking', 'Catering']
      },
      category: {
        _id: 'mock-category',
        name: 'Sample Category',
        color: '#007bff'
      },
      organizer: {
        _id: 'mock-organizer',
        firstName: 'Sample',
        lastName: 'Organizer',
        email: 'organizer@example.com'
      },
      maxAttendees: 100,
      registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: 'published',
      isPublic: true,
      isActive: true,
      isFeatured: false,
      tags: ['sample', 'demo'],
      requirements: ['Sample requirement'],
      agenda: [
        {
          time: '10:00',
          title: 'Opening Session',
          description: 'Welcome and introduction'
        },
        {
          time: '11:00',
          title: 'Main Presentation',
          description: 'Core content presentation'
        },
        {
          time: '12:00',
          title: 'Q&A Session',
          description: 'Questions and answers'
        }
      ],
      registrationCount: 25,
      waitlistCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.status(200).json({
      success: true,
      message: 'Using demo data (database not available)',
      data: mockEvent
    });
  }
});

// @desc    Create event
// @route   POST /api/events
// @access  Private/Organizer/Admin
const createEvent = catchAsync(async (req, res, next) => {
  req.body.organizer = req.user.id;

  const event = await Event.create(req.body);

  res.status(201).json({
    success: true,
    data: {
      event
    }
  });
});

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private/Organizer/Admin
const updateEvent = catchAsync(async (req, res, next) => {
  let event = await Event.findById(req.params.id);

  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  // Check ownership (organizer can only update their own events)
  if (req.user.role !== 'admin' && event.organizer.toString() !== req.user.id) {
    return next(new AppError('Not authorized to update this event', 403));
  }

  // Handle image upload if present
  if (req.file && req.file.resizedImages) {
    req.body.images = {
      banner: req.file.resizedImages
    };
  }

  event = await Event.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: {
      event
    }
  });
});

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private/Organizer/Admin
const deleteEvent = catchAsync(async (req, res, next) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  // Check ownership
  if (req.user.role !== 'admin' && event.organizer.toString() !== req.user.id) {
    return next(new AppError('Not authorized to delete this event', 403));
  }

  // Soft delete
  event.isActive = false;
  await event.save();

  res.status(200).json({
    success: true,
    message: 'Event deleted successfully'
  });
});

// @desc    Get my events
// @route   GET /api/events/my/events
// @access  Private/Organizer/Admin
const getMyEvents = catchAsync(async (req, res, next) => {
  const { page, limit, skip } = getPagination(req.query.page, req.query.limit);

  const events = await Event.find({ organizer: req.user.id })
    .populate('category', 'name color')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Event.countDocuments({ organizer: req.user.id });

  const response = buildPaginationResponse(events, total, page, limit);

  res.status(200).json({
    success: true,
    ...response
  });
});

// @desc    Get event statistics
// @route   GET /api/events/admin/stats
// @access  Private/Admin
const getEventStats = catchAsync(async (req, res, next) => {
  const totalEvents = await Event.countDocuments({ isActive: true });
  const publishedEvents = await Event.countDocuments({ status: 'published', isActive: true });
  const upcomingEvents = await Event.countDocuments({ 
    startDate: { $gt: new Date() }, 
    isActive: true 
  });

  const eventsByCategory = await Event.aggregate([
    { $match: { isActive: true } },
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'categoryInfo'
      }
    },
    { $unwind: '$categoryInfo' },
    {
      $group: {
        _id: '$categoryInfo.name',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalEvents,
      publishedEvents,
      upcomingEvents,
      eventsByCategory
    }
  });
});

// Placeholder functions for additional features
const duplicateEvent = catchAsync(async (req, res, next) => {
  res.status(501).json({
    success: false,
    message: 'Feature not implemented yet'
  });
});

const getEventRegistrations = catchAsync(async (req, res, next) => {
  res.status(501).json({
    success: false,
    message: 'Feature not implemented yet'
  });
});

const exportEventData = catchAsync(async (req, res, next) => {
  res.status(501).json({
    success: false,
    message: 'Feature not implemented yet'
  });
});

// Multer upload middleware
const uploadEventImage = uploadSingle('image');

module.exports = {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getMyEvents,
  getEventStats,
  duplicateEvent,
  getEventRegistrations,
  exportEventData,
  uploadEventImage,
  resizeEventImage
};
