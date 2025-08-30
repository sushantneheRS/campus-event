const express = require('express');
const router = express.Router();

// Import middleware
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { 
  validateEventCreation,
  validatePagination,
  validateEventQuery,
  validateObjectId 
} = require('../middleware/validation');

// Import controllers (will be created next)
const {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventStats,
  uploadEventImage,
  resizeEventImage,
  getMyEvents,
  duplicateEvent,
  getEventRegistrations,
  exportEventData
} = require('../controllers/eventController');

// Public routes (with optional authentication)
router.get('/', optionalAuth, validatePagination, validateEventQuery, getEvents);
router.get('/:id', optionalAuth, validateObjectId, getEvent);

// Protected routes
router.use(protect);

// Routes for organizers and admins
router.post('/', 
  authorize('organizer', 'admin'), 
  validateEventCreation, 
  createEvent
);

router.get('/my/events', 
  authorize('organizer', 'admin'), 
  validatePagination, 
  getMyEvents
);

router
  .route('/:id')
  .put(validateObjectId, authorize('organizer', 'admin'), updateEvent)
  .delete(validateObjectId, authorize('organizer', 'admin'), deleteEvent);

// Event management routes
router.post('/:id/duplicate', 
  validateObjectId,
  authorize('organizer', 'admin'), 
  duplicateEvent
);

router.get('/:id/registrations', 
  validateObjectId,
  authorize('organizer', 'admin'), 
  getEventRegistrations
);

router.get('/:id/export', 
  validateObjectId,
  authorize('organizer', 'admin'), 
  exportEventData
);

// Image upload route
router.post('/:id/image', 
  validateObjectId,
  authorize('organizer', 'admin'),
  uploadEventImage,
  resizeEventImage,
  updateEvent
);

// Admin only routes
router.get('/admin/stats', authorize('admin'), getEventStats);

module.exports = router;
