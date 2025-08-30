const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required']
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'event_registration',
      'event_reminder',
      'event_update',
      'event_cancellation',
      'event_approval',
      'event_rejection',
      'system_announcement',
      'password_reset',
      'account_verification',
      'general'
    ],
    required: [true, 'Notification type is required']
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  data: {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    },
    registrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration'
    },
    actionUrl: String,
    actionText: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  channels: {
    inApp: {
      enabled: {
        type: Boolean,
        default: true
      },
      delivered: {
        type: Boolean,
        default: false
      },
      deliveredAt: Date
    },
    email: {
      enabled: {
        type: Boolean,
        default: false
      },
      delivered: {
        type: Boolean,
        default: false
      },
      deliveredAt: Date,
      emailId: String,
      bounced: {
        type: Boolean,
        default: false
      },
      opened: {
        type: Boolean,
        default: false
      },
      openedAt: Date,
      clicked: {
        type: Boolean,
        default: false
      },
      clickedAt: Date
    },
    sms: {
      enabled: {
        type: Boolean,
        default: false
      },
      delivered: {
        type: Boolean,
        default: false
      },
      deliveredAt: Date,
      smsId: String,
      failed: {
        type: Boolean,
        default: false
      },
      failureReason: String
    },
    push: {
      enabled: {
        type: Boolean,
        default: false
      },
      delivered: {
        type: Boolean,
        default: false
      },
      deliveredAt: Date,
      pushId: String,
      clicked: {
        type: Boolean,
        default: false
      },
      clickedAt: Date
    }
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'cancelled'],
    default: 'pending'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  scheduledFor: Date,
  expiresAt: Date,
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  lastRetryAt: Date,
  errorMessage: String,
  template: {
    name: String,
    variables: mongoose.Schema.Types.Mixed
  },
  batchId: String,
  campaignId: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ scheduledFor: 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ batchId: 1 });
notificationSchema.index({ campaignId: 1 });

// Virtual for is expired
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Virtual for delivery status
notificationSchema.virtual('deliveryStatus').get(function() {
  const channels = this.channels;
  const delivered = [];
  const failed = [];

  if (channels.inApp.enabled) {
    if (channels.inApp.delivered) delivered.push('in-app');
    else failed.push('in-app');
  }

  if (channels.email.enabled) {
    if (channels.email.delivered) delivered.push('email');
    else if (channels.email.bounced) failed.push('email');
  }

  if (channels.sms.enabled) {
    if (channels.sms.delivered) delivered.push('sms');
    else if (channels.sms.failed) failed.push('sms');
  }

  if (channels.push.enabled) {
    if (channels.push.delivered) delivered.push('push');
    else failed.push('push');
  }

  return { delivered, failed };
});

// Pre-save middleware to set expiration
notificationSchema.pre('save', function(next) {
  // Set default expiration to 30 days if not set
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  
  // Set readAt when marking as read
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  
  next();
});

// Instance method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Instance method to mark as delivered for a channel
notificationSchema.methods.markAsDelivered = function(channel, deliveryId = null) {
  if (this.channels[channel]) {
    this.channels[channel].delivered = true;
    this.channels[channel].deliveredAt = new Date();
    
    if (deliveryId) {
      this.channels[channel][`${channel}Id`] = deliveryId;
    }
    
    // Update overall status
    const allChannelsDelivered = Object.keys(this.channels).every(ch => 
      !this.channels[ch].enabled || this.channels[ch].delivered
    );
    
    if (allChannelsDelivered) {
      this.status = 'delivered';
    }
  }
  
  return this.save();
};

// Instance method to mark as failed for a channel
notificationSchema.methods.markAsFailed = function(channel, errorMessage = null) {
  if (this.channels[channel]) {
    if (channel === 'email') {
      this.channels[channel].bounced = true;
    } else if (channel === 'sms') {
      this.channels[channel].failed = true;
      this.channels[channel].failureReason = errorMessage;
    }
    
    this.errorMessage = errorMessage;
    this.status = 'failed';
  }
  
  return this.save();
};

// Instance method to track email open
notificationSchema.methods.trackEmailOpen = function() {
  if (this.channels.email.enabled) {
    this.channels.email.opened = true;
    this.channels.email.openedAt = new Date();
  }
  
  return this.save();
};

// Instance method to track click
notificationSchema.methods.trackClick = function(channel = 'email') {
  if (this.channels[channel] && this.channels[channel].enabled) {
    this.channels[channel].clicked = true;
    this.channels[channel].clickedAt = new Date();
  }
  
  return this.save();
};

// Instance method to retry delivery
notificationSchema.methods.retry = function() {
  if (this.retryCount < this.maxRetries) {
    this.retryCount += 1;
    this.lastRetryAt = new Date();
    this.status = 'pending';
    this.errorMessage = null;
    
    return this.save();
  }
  
  throw new Error('Maximum retry attempts reached');
};

// Static method to get unread count for user
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    isRead: false,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  });
};

// Static method to mark all as read for user
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

// Static method to get notifications for user
notificationSchema.statics.getForUser = function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    type,
    isRead,
    priority
  } = options;

  const query = {
    recipient: userId,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  };

  if (type) query.type = type;
  if (typeof isRead === 'boolean') query.isRead = isRead;
  if (priority) query.priority = priority;

  const skip = (page - 1) * limit;

  return this.find(query)
    .populate('sender', 'firstName lastName')
    .populate('data.eventId', 'title startDate')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to cleanup expired notifications
notificationSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

// Static method to get delivery statistics
notificationSchema.statics.getDeliveryStats = function(dateRange = {}) {
  const { startDate, endDate } = dateRange;
  const matchQuery = {};

  if (startDate || endDate) {
    matchQuery.createdAt = {};
    if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
    if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
  }

  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('Notification', notificationSchema);
