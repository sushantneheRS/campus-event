const Category = require('../models/Category');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const {
  getPagination,
  buildPaginationResponse,
  buildSortObject
} = require('../utils/helpers');
const { mockCategories } = require('../utils/mockData');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = catchAsync(async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit);
    const { hierarchy, sortBy, sortOrder } = req.query;

    // If hierarchy is requested, return tree structure
    if (hierarchy === 'true') {
      const categories = await Category.getHierarchy();

      return res.status(200).json({
        success: true,
        data: {
          categories
        }
      });
    }

    // Build sort
    const sort = buildSortObject(sortBy || 'sortOrder', sortOrder);

    // Execute query
    const categories = await Category.find({ isActive: true })
      .populate('createdBy', 'firstName lastName')
      .populate('parentCategory', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Category.countDocuments({ isActive: true });

    const response = buildPaginationResponse(categories, total, page, limit);

    res.status(200).json({
      success: true,
      ...response
    });
  } catch (error) {
    console.log('Database error, using mock categories:', error.message);

    // Fallback to mock data if database is not available
    const { page: currentPage, limit: pageLimit } = getPagination(req.query.page, req.query.limit);
    const startIndex = (currentPage - 1) * pageLimit;
    const endIndex = startIndex + pageLimit;
    const paginatedCategories = mockCategories.slice(startIndex, endIndex);

    const response = buildPaginationResponse(paginatedCategories, mockCategories.length, currentPage, pageLimit);

    res.status(200).json({
      success: true,
      message: 'Using demo data (database not available)',
      ...response
    });
  }
});

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
const getCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id)
    .populate('createdBy', 'firstName lastName')
    .populate('parentCategory', 'name')
    .populate('subcategories');

  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      category
    }
  });
});

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = catchAsync(async (req, res, next) => {
  req.body.createdBy = req.user.id;

  const category = await Category.create(req.body);

  // If this is a subcategory, add it to parent's subcategories array
  if (category.parentCategory) {
    await Category.findByIdAndUpdate(
      category.parentCategory,
      { $push: { subcategories: category._id } }
    );
  }

  res.status(201).json({
    success: true,
    data: {
      category
    }
  });
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      category
    }
  });
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  // Check if category has events
  const Event = require('../models/Event');
  const eventCount = await Event.countDocuments({ category: category._id });

  if (eventCount > 0) {
    return next(new AppError('Cannot delete category with existing events', 400));
  }

  await category.remove();

  res.status(200).json({
    success: true,
    message: 'Category deleted successfully'
  });
});

// @desc    Get category statistics
// @route   GET /api/categories/admin/stats
// @access  Private/Admin
const getCategoryStats = catchAsync(async (req, res, next) => {
  const totalCategories = await Category.countDocuments({ isActive: true });
  
  const categoryEventCounts = await Category.aggregate([
    { $match: { isActive: true } },
    {
      $lookup: {
        from: 'events',
        localField: '_id',
        foreignField: 'category',
        as: 'events'
      }
    },
    {
      $project: {
        name: 1,
        eventCount: { $size: '$events' }
      }
    },
    { $sort: { eventCount: -1 } }
  ]);

  const hierarchyStats = await Category.aggregate([
    {
      $group: {
        _id: {
          hasParent: { $cond: [{ $eq: ['$parentCategory', null] }, 'root', 'subcategory'] }
        },
        count: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalCategories,
      categoryEventCounts,
      hierarchyStats
    }
  });
});

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats
};
