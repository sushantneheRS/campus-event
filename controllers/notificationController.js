const Notification = require('../models/Notification');
const User = require('../models/User');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const { 
  getPagination, 
  buildPaginationResponse 
} = require('../utils/helpers');
const emailService = require('../utils/emailService');

// @desc    Get notifications for current user
// @route   GET /api/notifications
// @access  Private
const getNotifications = catchAsync(async (req, res, next) => {
  const { page, limit, skip } = getPagination(req.query.page, req.query.limit);
  const { type, isRead, priority } = req.query;

  // Build query
  const query = {
    recipient: req.user.id,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  };

  if (type) query.type = type;
  if (typeof isRead === 'string') query.isRead = isRead === 'true';
  if (priority) query.priority = priority;

  // Get notifications
  const notifications = await Notification.find(query)
    .populate('sender', 'firstName lastName')
    .populate('data.eventId', 'title startDate')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Notification.countDocuments(query);

  const response = buildPaginationResponse(notifications, total, page, limit);

  res.status(200).json({
    success: true,
    ...response
  });
});

// @desc    Get single notification
// @route   GET /api/notifications/:id
// @access  Private
const getNotification = catchAsync(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id)
    .populate('sender', 'firstName lastName')
    .populate('data.eventId', 'title startDate');

  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  // Check ownership
  if (notification.recipient.toString() !== req.user.id) {
    return next(new AppError('Not authorized to view this notification', 403));
  }

  res.status(200).json({
    success: true,
    data: {
      notification
    }
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = catchAsync(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  // Check ownership
  if (notification.recipient.toString() !== req.user.id) {
    return next(new AppError('Not authorized to update this notification', 403));
  }

  await notification.markAsRead();

  res.status(200).json({
    success: true,
    data: {
      notification
    }
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = catchAsync(async (req, res, next) => {
  await Notification.markAllAsRead(req.user.id);

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = catchAsync(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  // Check ownership
  if (notification.recipient.toString() !== req.user.id) {
    return next(new AppError('Not authorized to delete this notification', 403));
  }

  await notification.remove();

  res.status(200).json({
    success: true,
    message: 'Notification deleted successfully'
  });
});

// @desc    Send notification
// @route   POST /api/notifications/send
// @access  Private/Organizer/Admin
const sendNotification = catchAsync(async (req, res, next) => {
  const {
    recipientId,
    type,
    title,
    message,
    data,
    channels,
    priority,
    scheduledFor
  } = req.body;

  // Check if recipient exists
  const recipient = await User.findById(recipientId);
  if (!recipient) {
    return next(new AppError('Recipient not found', 404));
  }

  const notification = await Notification.create({
    recipient: recipientId,
    sender: req.user.id,
    type,
    title,
    message,
    data,
    channels: channels || { inApp: { enabled: true } },
    priority: priority || 'normal',
    scheduledFor
  });

  // Send immediate notifications if not scheduled
  if (!scheduledFor || new Date(scheduledFor) <= new Date()) {
    // Send in-app notification via socket
    if (notification.channels.inApp.enabled && req.io) {
      req.io.to(`user_${recipientId}`).emit('notification', {
        id: notification._id,
        title,
        message,
        type,
        createdAt: notification.createdAt
      });
      
      await notification.markAsDelivered('inApp');
    }

    // Send email notification
    if (notification.channels.email.enabled) {
      try {
        await emailService.sendCustomEmail(recipient.email, title, message);
        await notification.markAsDelivered('email');
      } catch (error) {
        await notification.markAsFailed('email', error.message);
      }
    }
  }

  res.status(201).json({
    success: true,
    data: {
      notification
    }
  });
});

// @desc    Send bulk notification
// @route   POST /api/notifications/send-bulk
// @access  Private/Organizer/Admin
const sendBulkNotification = catchAsync(async (req, res, next) => {
  const {
    recipientIds,
    type,
    title,
    message,
    data,
    channels,
    priority
  } = req.body;

  if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
    return next(new AppError('Recipient IDs are required', 400));
  }

  // Verify all recipients exist
  const recipients = await User.find({ _id: { $in: recipientIds } });
  if (recipients.length !== recipientIds.length) {
    return next(new AppError('Some recipients not found', 400));
  }

  const notifications = [];
  const batchId = require('uuid').v4();

  // Create notifications for all recipients
  for (const recipientId of recipientIds) {
    const notification = await Notification.create({
      recipient: recipientId,
      sender: req.user.id,
      type,
      title,
      message,
      data,
      channels: channels || { inApp: { enabled: true } },
      priority: priority || 'normal',
      batchId
    });

    notifications.push(notification);

    // Send in-app notification via socket
    if (notification.channels.inApp.enabled && req.io) {
      req.io.to(`user_${recipientId}`).emit('notification', {
        id: notification._id,
        title,
        message,
        type,
        createdAt: notification.createdAt
      });
      
      await notification.markAsDelivered('inApp');
    }
  }

  // Send bulk email if enabled
  if (channels && channels.email && channels.email.enabled) {
    try {
      await emailService.sendBulkEmails(recipients, 'custom', [title, message]);
    } catch (error) {
      console.error('Bulk email failed:', error);
    }
  }

  res.status(201).json({
    success: true,
    data: {
      notifications,
      batchId,
      count: notifications.length
    }
  });
});

// @desc    Test email configuration
// @route   POST /api/notifications/test-email
// @access  Private/Admin
const testEmail = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError('Email address is required', 400));
  }

  try {
    console.log('=== TESTING EMAIL CONFIGURATION ===');
    console.log('Sending test email to:', email);
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
    console.log('ENABLE_EMAIL_NOTIFICATIONS:', process.env.ENABLE_EMAIL_NOTIFICATIONS);

    await emailService.sendCustomEmail(
      email,
      'Email Configuration Test',
      `
        <h2>🎉 Email Test Successful!</h2>
        <p>Your email configuration is working properly.</p>
        <p><strong>Server:</strong> ${process.env.EMAIL_HOST}</p>
        <p><strong>From:</strong> ${process.env.EMAIL_USER}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <hr>
        <p><em>Campus Event Management System</em></p>
      `
    );

    console.log('✅ Test email sent successfully');

    res.status(200).json({
      success: true,
      message: 'Test email sent successfully',
      data: {
        recipient: email,
        timestamp: new Date().toISOString(),
        emailConfig: {
          host: process.env.EMAIL_HOST,
          user: process.env.EMAIL_USER,
          enabled: process.env.ENABLE_EMAIL_NOTIFICATIONS
        }
      }
    });
  } catch (error) {
    console.error('❌ Email test failed:', error.message);

    res.status(500).json({
      success: false,
      message: 'Email test failed',
      error: error.message,
      details: {
        emailUser: process.env.EMAIL_USER,
        emailHost: process.env.EMAIL_HOST,
        emailEnabled: process.env.ENABLE_EMAIL_NOTIFICATIONS
      }
    });
  }
});

// @desc    Get notification statistics
// @route   GET /api/notifications/admin/stats
// @access  Private/Admin
const getNotificationStats = catchAsync(async (req, res, next) => {
  const totalNotifications = await Notification.countDocuments();
  
  const typeStats = await Notification.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 }
      }
    }
  ]);

  const statusStats = await Notification.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const deliveryStats = await Notification.getDeliveryStats();

  const unreadCounts = await Notification.aggregate([
    { $match: { isRead: false } },
    {
      $group: {
        _id: '$recipient',
        unreadCount: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        avgUnread: { $avg: '$unreadCount' },
        maxUnread: { $max: '$unreadCount' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalNotifications,
      typeStats,
      statusStats,
      deliveryStats,
      unreadCounts: unreadCounts[0] || { totalUsers: 0, avgUnread: 0, maxUnread: 0 }
    }
  });
});

module.exports = {
  getNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendNotification,
  sendBulkNotification,
  testEmail,
  getNotificationStats
};
