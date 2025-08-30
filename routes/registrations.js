const express = require('express');
const router = express.Router();

// Import middleware
const { protect, authorize } = require('../middleware/auth');
const { 
  validateRegistration,
  validatePagination,
  validateObjectId 
} = require('../middleware/validation');

// Import controllers (will be created next)
const {
  registerForEvent,
  unregisterFromEvent,
  getMyRegistrations,
  getRegistration,
  updateRegistrationStatus,
  getRegistrationStats,
  checkInParticipant,
  checkOutParticipant,
  getEventAttendance,
  exportRegistrations
} = require('../controllers/registrationController');

// All routes require authentication
router.use(protect);

// Participant routes
router.post('/', validateRegistration, registerForEvent);
router.delete('/:id', validateObjectId, unregisterFromEvent);
router.get('/my', validatePagination, getMyRegistrations);
router.get('/:id', validateObjectId, getRegistration);

// Organizer and Admin routes
router.put('/:id/status', 
  validateObjectId,
  authorize('organizer', 'admin'), 
  updateRegistrationStatus
);

router.post('/:id/checkin', 
  validateObjectId,
  authorize('organizer', 'admin'), 
  checkInParticipant
);

router.post('/:id/checkout', 
  validateObjectId,
  authorize('organizer', 'admin'), 
  checkOutParticipant
);

router.get('/event/:eventId/attendance', 
  validateObjectId,
  authorize('organizer', 'admin'), 
  getEventAttendance
);

router.get('/event/:eventId/export', 
  validateObjectId,
  authorize('organizer', 'admin'), 
  exportRegistrations
);

// Admin only routes
router.get('/admin/stats', authorize('admin'), getRegistrationStats);

module.exports = router;
