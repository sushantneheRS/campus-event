const express = require('express');
const router = express.Router();

// Import middleware
const { protect, authorize } = require('../middleware/auth');
const { 
  validatePagination,
  validateObjectId 
} = require('../middleware/validation');

// Import controllers (will be created next)
const {
  getNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendNotification,
  sendBulkNotification,
  testEmail,
  getNotificationStats
} = require('../controllers/notificationController');

// All routes require authentication
router.use(protect);

// User routes
router.get('/', validatePagination, getNotifications);
router.get('/:id', validateObjectId, getNotification);
router.put('/:id/read', validateObjectId, markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:id', validateObjectId, deleteNotification);

// Organizer and Admin routes
router.post('/send', 
  authorize('organizer', 'admin'), 
  sendNotification
);

router.post('/send-bulk', 
  authorize('organizer', 'admin'), 
  sendBulkNotification
);

// Admin only routes
router.post('/test-email', authorize('admin'), testEmail);
router.get('/admin/stats', authorize('admin'), getNotificationStats);

module.exports = router;
