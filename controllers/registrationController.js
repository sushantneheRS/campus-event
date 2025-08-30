const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const { 
  getPagination, 
  buildPaginationResponse 
} = require('../utils/helpers');
const emailService = require('../utils/emailService');

// @desc    Register for event
// @route   POST /api/registrations
// @access  Private
const registerForEvent = catchAsync(async (req, res, next) => {
  const { eventId, additionalInfo, emergencyContact, dietaryRestrictions, specialRequirements } = req.body;

  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  // Check if user can register
  const canRegister = event.canUserRegister(req.user.id);
  if (!canRegister.canRegister) {
    return next(new AppError(canRegister.reason, 400));
  }

  // Check if user is already registered
  const existingRegistration = await Registration.findOne({
    event: eventId,
    participant: req.user.id
  });

  if (existingRegistration) {
    return next(new AppError('You are already registered for this event', 400));
  }

  // Determine registration status
  let status = 'confirmed';
  if (event.requiresApproval) {
    status = 'pending';
  } else if (event.isFull) {
    status = 'waitlisted';
  }

  // Create registration
  const registration = await Registration.create({
    event: eventId,
    participant: req.user.id,
    status,
    additionalInfo,
    emergencyContact,
    dietaryRestrictions,
    specialRequirements
  });

  // Send confirmation email
  try {
    await emailService.sendRegistrationConfirmation(req.user, event);
  } catch (error) {
    console.error('Registration confirmation email failed:', error);
  }

  res.status(201).json({
    success: true,
    data: {
      registration
    }
  });
});

// @desc    Unregister from event
// @route   DELETE /api/registrations/:id
// @access  Private
const unregisterFromEvent = catchAsync(async (req, res, next) => {
  const registration = await Registration.findById(req.params.id);

  if (!registration) {
    return next(new AppError('Registration not found', 404));
  }

  // Check ownership
  if (registration.participant.toString() !== req.user.id) {
    return next(new AppError('Not authorized to cancel this registration', 403));
  }

  // Check if event has started
  const event = await Event.findById(registration.event);
  if (event.startDate <= new Date()) {
    return next(new AppError('Cannot cancel registration for events that have already started', 400));
  }

  await registration.cancel('Cancelled by participant');

  res.status(200).json({
    success: true,
    message: 'Registration cancelled successfully'
  });
});

// @desc    Get my registrations
// @route   GET /api/registrations/my
// @access  Private
const getMyRegistrations = catchAsync(async (req, res, next) => {
  const { page, limit, skip } = getPagination(req.query.page, req.query.limit);
  const { status } = req.query;

  const query = { participant: req.user.id };
  if (status) query.status = status;

  const registrations = await Registration.find(query)
    .populate('event', 'title startDate endDate venue category')
    .populate('event.category', 'name color')
    .sort({ registrationDate: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Registration.countDocuments(query);

  const response = buildPaginationResponse(registrations, total, page, limit);

  res.status(200).json({
    success: true,
    ...response
  });
});

// @desc    Get single registration
// @route   GET /api/registrations/:id
// @access  Private
const getRegistration = catchAsync(async (req, res, next) => {
  const registration = await Registration.findById(req.params.id)
    .populate('event')
    .populate('participant', 'firstName lastName email');

  if (!registration) {
    return next(new AppError('Registration not found', 404));
  }

  // Check access rights
  const isOwner = registration.participant._id.toString() === req.user.id;
  const isEventOrganizer = registration.event.organizer.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isEventOrganizer && !isAdmin) {
    return next(new AppError('Not authorized to view this registration', 403));
  }

  res.status(200).json({
    success: true,
    data: {
      registration
    }
  });
});

// @desc    Update registration status
// @route   PUT /api/registrations/:id/status
// @access  Private/Organizer/Admin
const updateRegistrationStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  
  const registration = await Registration.findById(req.params.id)
    .populate('event');

  if (!registration) {
    return next(new AppError('Registration not found', 404));
  }

  // Check authorization
  const isEventOrganizer = registration.event.organizer.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isEventOrganizer && !isAdmin) {
    return next(new AppError('Not authorized to update this registration', 403));
  }

  registration.status = status;
  await registration.save();

  res.status(200).json({
    success: true,
    data: {
      registration
    }
  });
});

// @desc    Check in participant
// @route   POST /api/registrations/:id/checkin
// @access  Private/Organizer/Admin
const checkInParticipant = catchAsync(async (req, res, next) => {
  const registration = await Registration.findById(req.params.id)
    .populate('event');

  if (!registration) {
    return next(new AppError('Registration not found', 404));
  }

  // Check authorization
  const isEventOrganizer = registration.event.organizer.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isEventOrganizer && !isAdmin) {
    return next(new AppError('Not authorized to check in participants', 403));
  }

  await registration.checkIn(req.user.id);

  res.status(200).json({
    success: true,
    data: {
      registration
    }
  });
});

// @desc    Check out participant
// @route   POST /api/registrations/:id/checkout
// @access  Private/Organizer/Admin
const checkOutParticipant = catchAsync(async (req, res, next) => {
  const registration = await Registration.findById(req.params.id)
    .populate('event');

  if (!registration) {
    return next(new AppError('Registration not found', 404));
  }

  // Check authorization
  const isEventOrganizer = registration.event.organizer.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isEventOrganizer && !isAdmin) {
    return next(new AppError('Not authorized to check out participants', 403));
  }

  await registration.checkOut(req.user.id);

  res.status(200).json({
    success: true,
    data: {
      registration
    }
  });
});

// @desc    Get registration statistics
// @route   GET /api/registrations/admin/stats
// @access  Private/Admin
const getRegistrationStats = catchAsync(async (req, res, next) => {
  const totalRegistrations = await Registration.countDocuments();

  const statusStats = await Registration.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // This month's registrations
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  const newRegistrationsThisMonth = await Registration.countDocuments({
    createdAt: { $gte: thisMonth }
  });

  // Top participants by registration count
  const topParticipants = await Registration.aggregate([
    {
      $group: {
        _id: '$participant',
        registrationCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'participant'
      }
    },
    {
      $unwind: '$participant'
    },
    {
      $project: {
        _id: '$participant._id',
        firstName: '$participant.firstName',
        lastName: '$participant.lastName',
        email: '$participant.email',
        registrationCount: 1
      }
    },
    {
      $sort: { registrationCount: -1 }
    },
    {
      $limit: 20
    }
  ]);

  // Monthly registration trends (last 12 months)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const monthlyTrends = await Registration.aggregate([
    {
      $match: {
        createdAt: { $gte: twelveMonthsAgo }
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

  // Average registrations per user
  const userRegistrationCounts = await Registration.aggregate([
    {
      $group: {
        _id: '$participant',
        count: { $sum: 1 }
      }
    }
  ]);

  const averageRegistrationsPerUser = userRegistrationCounts.length > 0
    ? userRegistrationCounts.reduce((sum, user) => sum + user.count, 0) / userRegistrationCounts.length
    : 0;

  // Engagement statistics
  const engagementStats = {
    totalUniqueParticipants: userRegistrationCounts.length,
    averageEventsPerParticipant: averageRegistrationsPerUser,
    highEngagementUsers: userRegistrationCounts.filter(u => u.count >= 5).length,
    lowEngagementUsers: userRegistrationCounts.filter(u => u.count === 1).length
  };

  res.status(200).json({
    success: true,
    data: {
      totalRegistrations,
      statusStats,
      newRegistrationsThisMonth,
      topParticipants,
      monthlyTrends,
      averageRegistrationsPerUser,
      engagementStats
    }
  });
});

// Placeholder functions for additional features
const getEventAttendance = catchAsync(async (req, res, next) => {
  res.status(501).json({
    success: false,
    message: 'Feature not implemented yet'
  });
});

const exportRegistrations = catchAsync(async (req, res, next) => {
  res.status(501).json({
    success: false,
    message: 'Feature not implemented yet'
  });
});

module.exports = {
  registerForEvent,
  unregisterFromEvent,
  getMyRegistrations,
  getRegistration,
  updateRegistrationStatus,
  checkInParticipant,
  checkOutParticipant,
  getRegistrationStats,
  getEventAttendance,
  exportRegistrations
};
