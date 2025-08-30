const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event is required']
  },
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Participant is required']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'waitlisted', 'cancelled', 'attended', 'no-show'],
    default: 'pending'
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  confirmationDate: Date,
  cancellationDate: Date,
  cancellationReason: String,
  additionalInfo: {
    type: String,
    maxlength: [1000, 'Additional info cannot exceed 1000 characters']
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  dietaryRestrictions: [String],
  specialRequirements: String,
  attendanceStatus: {
    checkedIn: {
      type: Boolean,
      default: false
    },
    checkedInAt: Date,
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    checkedOut: {
      type: Boolean,
      default: false
    },
    checkedOutAt: Date,
    checkedOutBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: [1000, 'Feedback comment cannot exceed 1000 characters']
    },
    submittedAt: Date,
    wouldRecommend: Boolean,
    categories: {
      content: Number,
      organization: Number,
      venue: Number,
      overall: Number
    }
  },
  notifications: {
    confirmationSent: {
      type: Boolean,
      default: false
    },
    confirmationSentAt: Date,
    reminderSent: {
      type: Boolean,
      default: false
    },
    reminderSentAt: Date,
    followUpSent: {
      type: Boolean,
      default: false
    },
    followUpSentAt: Date
  },
  paymentInfo: {
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    paymentMethod: String,
    paidAt: Date,
    refundedAt: Date,
    refundAmount: Number
  },
  qrCode: String,
  registrationNumber: {
    type: String,
    unique: true
  },
  source: {
    type: String,
    enum: ['web', 'mobile', 'admin', 'import'],
    default: 'web'
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    referrer: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes
registrationSchema.index({ event: 1, participant: 1 }, { unique: true });
registrationSchema.index({ event: 1, status: 1 });
registrationSchema.index({ participant: 1, status: 1 });
registrationSchema.index({ registrationDate: -1 });
registrationSchema.index({ status: 1 });
registrationSchema.index({ registrationNumber: 1 });

// Virtual for is attended
registrationSchema.virtual('isAttended').get(function() {
  return this.attendanceStatus.checkedIn;
});

// Virtual for duration attended (if checked out)
registrationSchema.virtual('attendanceDuration').get(function() {
  if (this.attendanceStatus.checkedIn && this.attendanceStatus.checkedOut) {
    return this.attendanceStatus.checkedOutAt - this.attendanceStatus.checkedInAt;
  }
  return null;
});

// Pre-save middleware to generate registration number
registrationSchema.pre('save', async function(next) {
  if (this.isNew && !this.registrationNumber) {
    const count = await this.constructor.countDocuments();
    const year = new Date().getFullYear();
    this.registrationNumber = `REG-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Pre-save middleware to set confirmation date
registrationSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'confirmed' && !this.confirmationDate) {
    this.confirmationDate = new Date();
  }
  
  if (this.isModified('status') && this.status === 'cancelled' && !this.cancellationDate) {
    this.cancellationDate = new Date();
  }
  
  next();
});

// Post-save middleware to update event registration count
registrationSchema.post('save', async function() {
  await this.updateEventCounts();
});

// Post-remove middleware to update event registration count
registrationSchema.post('remove', async function() {
  await this.updateEventCounts();
});

// Instance method to update event counts
registrationSchema.methods.updateEventCounts = async function() {
  const Event = mongoose.model('Event');
  
  const counts = await this.constructor.aggregate([
    { $match: { event: this.event } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const countMap = counts.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  const registrationCount = (countMap.confirmed || 0) + (countMap.pending || 0);
  const waitlistCount = countMap.waitlisted || 0;
  const attendanceCount = countMap.attended || 0;

  await Event.findByIdAndUpdate(this.event, {
    registrationCount,
    waitlistCount,
    attendanceCount
  });
};

// Instance method to check in participant
registrationSchema.methods.checkIn = function(checkedInBy) {
  this.attendanceStatus.checkedIn = true;
  this.attendanceStatus.checkedInAt = new Date();
  this.attendanceStatus.checkedInBy = checkedInBy;
  
  if (this.status === 'confirmed') {
    this.status = 'attended';
  }
  
  return this.save();
};

// Instance method to check out participant
registrationSchema.methods.checkOut = function(checkedOutBy) {
  this.attendanceStatus.checkedOut = true;
  this.attendanceStatus.checkedOutAt = new Date();
  this.attendanceStatus.checkedOutBy = checkedOutBy;
  
  return this.save();
};

// Instance method to cancel registration
registrationSchema.methods.cancel = function(reason) {
  this.status = 'cancelled';
  this.cancellationDate = new Date();
  this.cancellationReason = reason;
  
  return this.save();
};

// Instance method to confirm registration
registrationSchema.methods.confirm = function() {
  this.status = 'confirmed';
  this.confirmationDate = new Date();
  
  return this.save();
};

// Instance method to add to waitlist
registrationSchema.methods.addToWaitlist = function() {
  this.status = 'waitlisted';
  
  return this.save();
};

// Instance method to submit feedback
registrationSchema.methods.submitFeedback = function(feedbackData) {
  this.feedback = {
    ...feedbackData,
    submittedAt: new Date()
  };
  
  return this.save();
};

// Static method to get registration statistics
registrationSchema.statics.getStats = function(eventId) {
  return this.aggregate([
    { $match: { event: new mongoose.Types.ObjectId(eventId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Static method to get registrations by date range
registrationSchema.statics.getByDateRange = function(startDate, endDate, options = {}) {
  const query = {
    registrationDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };

  if (options.status) {
    query.status = options.status;
  }

  if (options.event) {
    query.event = options.event;
  }

  return this.find(query)
    .populate('event participant', 'title firstName lastName email')
    .sort({ registrationDate: -1 });
};

module.exports = mongoose.model('Registration', registrationSchema);
