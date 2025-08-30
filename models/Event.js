const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [200, 'Event title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true,
    maxlength: [2000, 'Event description cannot exceed 2000 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  startDate: {
    type: Date,
    required: [true, 'Event start date is required'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Event start date must be in the future'
    }
  },
  endDate: {
    type: Date,
    required: [true, 'Event end date is required'],
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'Event end date must be after start date'
    }
  },
  venue: {
    name: {
      type: String,
      required: [true, 'Venue name is required'],
      trim: true,
      maxlength: [200, 'Venue name cannot exceed 200 characters']
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    capacity: Number,
    facilities: [String]
  },
  capacity: {
    type: Number,
    required: [true, 'Event capacity is required'],
    min: [1, 'Capacity must be at least 1'],
    max: [10000, 'Capacity cannot exceed 10000']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Event category is required']
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Event organizer is required']
  },
  coOrganizers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  images: {
    banner: {
      large: String,
      medium: String,
      small: String
    },
    gallery: [{
      url: String,
      caption: String,
      alt: String
    }]
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  registrationDeadline: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value < this.startDate;
      },
      message: 'Registration deadline must be before event start date'
    }
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  requiresApproval: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'published'
  },
  registrationCount: {
    type: Number,
    default: 0
  },
  attendanceCount: {
    type: Number,
    default: 0
  },
  waitlistCount: {
    type: Number,
    default: 0
  },
  price: {
    amount: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD'
    },
    isFree: {
      type: Boolean,
      default: true
    }
  },
  schedule: [{
    title: String,
    description: String,
    startTime: Date,
    endTime: Date,
    speaker: String,
    location: String
  }],
  requirements: {
    ageLimit: {
      min: Number,
      max: Number
    },
    prerequisites: [String],
    equipment: [String],
    documents: [String]
  },
  contact: {
    email: String,
    phone: String,
    website: String,
    socialMedia: {
      facebook: String,
      twitter: String,
      instagram: String,
      linkedin: String
    }
  },
  feedback: {
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  },
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    uniqueViews: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    }
  },
  notifications: {
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
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
eventSchema.index({ startDate: 1 });
eventSchema.index({ endDate: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ isPublic: 1, isActive: 1 });
eventSchema.index({ isFeatured: 1 });
eventSchema.index({ tags: 1 });
eventSchema.index({ 'venue.name': 'text', title: 'text', description: 'text' });
eventSchema.index({ createdAt: -1 });

// Virtual for registrations
eventSchema.virtual('registrations', {
  ref: 'Registration',
  localField: '_id',
  foreignField: 'event'
});

// Virtual for available spots
eventSchema.virtual('availableSpots').get(function() {
  return Math.max(0, this.capacity - this.registrationCount);
});

// Virtual for is full
eventSchema.virtual('isFull').get(function() {
  return this.registrationCount >= this.capacity;
});

// Virtual for duration in hours
eventSchema.virtual('durationHours').get(function() {
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60));
});

// Virtual for is past event
eventSchema.virtual('isPast').get(function() {
  return this.endDate < new Date();
});

// Virtual for is upcoming
eventSchema.virtual('isUpcoming').get(function() {
  return this.startDate > new Date();
});

// Virtual for is ongoing
eventSchema.virtual('isOngoing').get(function() {
  const now = new Date();
  return this.startDate <= now && this.endDate >= now;
});

// Pre-save middleware to generate slug
eventSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    const baseSlug = this.title
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
    
    this.slug = `${baseSlug}-${Date.now()}`;
  }
  next();
});

// Pre-save middleware to update price.isFree
eventSchema.pre('save', function(next) {
  this.price.isFree = this.price.amount === 0;
  next();
});

// Static method to get upcoming events
eventSchema.statics.getUpcoming = function(limit = 10) {
  return this.find({
    startDate: { $gt: new Date() },
    status: 'published',
    isActive: true,
    isPublic: true
  })
  .populate('category organizer', 'name firstName lastName')
  .sort({ startDate: 1 })
  .limit(limit);
};

// Static method to get featured events
eventSchema.statics.getFeatured = function(limit = 5) {
  return this.find({
    isFeatured: true,
    status: 'published',
    isActive: true,
    isPublic: true,
    startDate: { $gt: new Date() }
  })
  .populate('category organizer', 'name firstName lastName')
  .sort({ startDate: 1 })
  .limit(limit);
};

// Static method to search events
eventSchema.statics.searchEvents = function(query, options = {}) {
  const {
    category,
    startDate,
    endDate,
    tags,
    organizer,
    venue,
    page = 1,
    limit = 10,
    sortBy = 'startDate',
    sortOrder = 'asc'
  } = options;

  const searchQuery = {
    status: 'published',
    isActive: true,
    isPublic: true
  };

  // Text search
  if (query) {
    searchQuery.$text = { $search: query };
  }

  // Category filter
  if (category) {
    searchQuery.category = category;
  }

  // Date range filter
  if (startDate || endDate) {
    searchQuery.startDate = {};
    if (startDate) searchQuery.startDate.$gte = new Date(startDate);
    if (endDate) searchQuery.startDate.$lte = new Date(endDate);
  }

  // Tags filter
  if (tags && tags.length > 0) {
    searchQuery.tags = { $in: tags };
  }

  // Organizer filter
  if (organizer) {
    searchQuery.organizer = organizer;
  }

  // Venue filter
  if (venue) {
    searchQuery['venue.name'] = new RegExp(venue, 'i');
  }

  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (page - 1) * limit;

  return this.find(searchQuery)
    .populate('category organizer', 'name firstName lastName')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Instance method to check if user can register
eventSchema.methods.canUserRegister = function(userId) {
  const now = new Date();
  
  // Check if event is in the future
  if (this.startDate <= now) {
    return { canRegister: false, reason: 'Event has already started' };
  }

  // Check if registration deadline has passed
  if (this.registrationDeadline && this.registrationDeadline <= now) {
    return { canRegister: false, reason: 'Registration deadline has passed' };
  }

  // Check if event is full
  if (this.isFull) {
    return { canRegister: false, reason: 'Event is full' };
  }

  // Check if event is active and published
  if (!this.isActive || this.status !== 'published') {
    return { canRegister: false, reason: 'Event is not available for registration' };
  }

  return { canRegister: true };
};

// Instance method to increment view count
eventSchema.methods.incrementViews = function(isUnique = false) {
  this.analytics.views += 1;
  if (isUnique) {
    this.analytics.uniqueViews += 1;
  }
  return this.save({ validateBeforeSave: false });
};

module.exports = mongoose.model('Event', eventSchema);
