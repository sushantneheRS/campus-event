const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Category description cannot exceed 500 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  color: {
    type: String,
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color code'],
    default: '#007bff'
  },
  icon: {
    type: String,
    default: 'calendar'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  subcategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  eventCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
categorySchema.index({ name: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ parentCategory: 1 });
categorySchema.index({ sortOrder: 1 });

// Virtual for events
categorySchema.virtual('events', {
  ref: 'Event',
  localField: '_id',
  foreignField: 'category'
});

// Pre-save middleware to generate slug
categorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  }
  next();
});

// Pre-remove middleware to handle subcategories
categorySchema.pre('remove', async function(next) {
  // Move subcategories to parent or make them root categories
  if (this.subcategories.length > 0) {
    await this.constructor.updateMany(
      { _id: { $in: this.subcategories } },
      { parentCategory: this.parentCategory }
    );
  }

  // Update parent category's subcategories array
  if (this.parentCategory) {
    await this.constructor.findByIdAndUpdate(
      this.parentCategory,
      { $pull: { subcategories: this._id } }
    );
  }

  next();
});

// Static method to get category hierarchy
categorySchema.statics.getHierarchy = async function() {
  const categories = await this.find({ isActive: true })
    .populate('subcategories')
    .sort({ sortOrder: 1, name: 1 });

  // Build hierarchy tree
  const rootCategories = categories.filter(cat => !cat.parentCategory);
  
  const buildTree = (parentId) => {
    return categories
      .filter(cat => cat.parentCategory && cat.parentCategory.toString() === parentId.toString())
      .map(cat => ({
        ...cat.toObject(),
        children: buildTree(cat._id)
      }));
  };

  return rootCategories.map(cat => ({
    ...cat.toObject(),
    children: buildTree(cat._id)
  }));
};

// Static method to update event count
categorySchema.statics.updateEventCount = async function(categoryId) {
  const eventCount = await mongoose.model('Event').countDocuments({
    category: categoryId,
    isActive: true
  });

  await this.findByIdAndUpdate(categoryId, { eventCount });
  return eventCount;
};

// Instance method to get full path
categorySchema.methods.getFullPath = async function() {
  const path = [this.name];
  let current = this;

  while (current.parentCategory) {
    current = await this.constructor.findById(current.parentCategory);
    if (current) {
      path.unshift(current.name);
    } else {
      break;
    }
  }

  return path.join(' > ');
};

// Instance method to get all descendants
categorySchema.methods.getAllDescendants = async function() {
  const descendants = [];
  
  const getChildren = async (categoryId) => {
    const children = await this.constructor.find({ parentCategory: categoryId });
    
    for (const child of children) {
      descendants.push(child);
      await getChildren(child._id);
    }
  };

  await getChildren(this._id);
  return descendants;
};

module.exports = mongoose.model('Category', categorySchema);
