const User = require('../models/User');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const { 
  getPagination, 
  buildPaginationResponse, 
  buildSortObject,
  buildSearchQuery 
} = require('../utils/helpers');
const { uploadSingle, resizeUserPhoto } = require('../utils/fileUpload');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = catchAsync(async (req, res, next) => {
  const { page, limit, skip } = getPagination(req.query.page, req.query.limit);
  const { search, role, department, isActive, sortBy, sortOrder } = req.query;

  // Build query
  const query = {};
  
  if (search) {
    const searchQuery = buildSearchQuery(search, ['firstName', 'lastName', 'email', 'department']);
    Object.assign(query, searchQuery);
  }
  
  if (role) query.role = role;
  if (department) query.department = new RegExp(department, 'i');
  if (typeof isActive === 'string') query.isActive = isActive === 'true';

  // Build sort
  const sort = buildSortObject(sortBy, sortOrder);

  // Execute query
  const users = await User.find(query)
    .select('-password')
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('registeredEvents', 'title startDate')
    .populate('createdEvents', 'title startDate');

  const total = await User.countDocuments(query);

  const response = buildPaginationResponse(users, total, page, limit);

  res.status(200).json({
    success: true,
    ...response
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
const getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('registeredEvents')
    .populate('createdEvents');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
});

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
const createUser = catchAsync(async (req, res, next) => {
  const user = await User.create(req.body);

  res.status(201).json({
    success: true,
    data: {
      user
    }
  });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = catchAsync(async (req, res, next) => {
  // Don't allow password updates through this route
  if (req.body.password) {
    return next(new AppError('Password cannot be updated through this route', 400));
  }

  // Handle file upload if present
  if (req.file) {
    req.body.profileImage = `/uploads/users/${req.file.filename}`;
  }

  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).select('-password');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Soft delete by setting isActive to false
  user.isActive = false;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User deactivated successfully'
  });
});

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private
const getUserStats = catchAsync(async (req, res, next) => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    }
  ]);

  const totalUsers = await User.countDocuments({ isActive: true });
  const newUsersThisMonth = await User.countDocuments({
    createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
    isActive: true
  });

  const departmentStats = await User.aggregate([
    { $match: { isActive: true, department: { $exists: true, $ne: null } } },
    {
      $group: {
        _id: '$department',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  res.status(200).json({
    success: true,
    data: {
      roleStats: stats,
      totalUsers,
      newUsersThisMonth,
      departmentStats
    }
  });
});

// Multer upload middleware
const uploadUserPhoto = uploadSingle('photo');

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  uploadUserPhoto,
  resizeUserPhoto
};
