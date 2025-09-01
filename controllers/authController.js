const crypto = require('crypto');
const User = require('../models/User');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const { generateToken } = require('../utils/helpers');
const { JWT_COOKIE_EXPIRE } = require('../config/auth');
const emailService = require('../utils/emailService');

// Helper function to create and send token
const createSendToken = (user, statusCode, res) => {
  const token = generateToken(user._id);
  
  const cookieDays = Number(JWT_COOKIE_EXPIRE) || 30;
  const cookieOptions = {
    expires: new Date(Date.now() + cookieDays * 24 * 60 * 60 * 1000),
    httpOnly: true
  };
  
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  
  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    data: {
      user
    }
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = catchAsync(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    password,
    role,
    phoneNumber,
    department,
    studentId,
    employeeId
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('User with this email already exists', 400));
  }

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role: role || 'participant',
    phoneNumber,
    department,
    studentId,
    employeeId
  });

  // Generate email verification token
  const verifyToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Send welcome email
  try {
    await emailService.sendWelcomeEmail(user);
  } catch (error) {
    console.error('Welcome email failed:', error);
    // Don't fail registration if email fails
  }

  createSendToken(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  try {
    // Check for user and include password
    const user = await User.findByCredentials(email, password);
    createSendToken(user, 200, res);
  } catch (err) {
    // Normalize auth errors
    const message = err && typeof err.message === 'string' ? err.message : 'Invalid credentials';
    const isLocked = message.toLowerCase().includes('locked');
    const statusCode = isLocked ? 423 : 401; // 423 Locked if account lockout
    return next(new AppError(message === 'Invalid credentials' ? 'Invalid credentials' : message, statusCode));
  }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
const logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id)
    .populate('registeredEvents')
    .populate('createdEvents');

  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = catchAsync(async (req, res, next) => {
  // Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with that email address', 404));
  }

  // Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    await emailService.sendPasswordReset(user, resetToken);

    res.status(200).json({
      success: true,
      message: 'Password reset token sent to email'
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later.', 500)
    );
  }
});

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = catchAsync(async (req, res, next) => {
  // Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.resetToken)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Log the user in, send JWT
  createSendToken(user, 200, res);
});

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
const updatePassword = catchAsync(async (req, res, next) => {
  console.log('=== UPDATE PASSWORD REQUEST ===');
  console.log('Request body:', req.body);
  console.log('User ID:', req.user.id);

  // Validate required fields
  if (!req.body.passwordCurrent || !req.body.password) {
    return next(new AppError('Current password and new password are required', 400));
  }

  // Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  console.log('User found:', user.email);
  console.log('Has current password:', !!user.password);

  // Check if POSTed current password is correct
  const isCurrentPasswordCorrect = await user.correctPassword(req.body.passwordCurrent, user.password);
  console.log('Current password correct:', isCurrentPasswordCorrect);

  if (!isCurrentPasswordCorrect) {
    return next(new AppError('Your current password is incorrect', 401));
  }

  // If so, update password
  user.password = req.body.password;
  await user.save();

  console.log('Password updated successfully');

  // Log user in, send JWT
  createSendToken(user, 200, res);
});

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
const updateProfile = catchAsync(async (req, res, next) => {
  // Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /update-password.',
        400
      )
    );
  }

  // Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = {};
  const allowedFields = [
    'firstName',
    'lastName',
    'phoneNumber',
    'department',
    'bio',
    'dateOfBirth',
    'address',
    'socialLinks',
    'preferences'
  ];

  Object.keys(req.body).forEach(el => {
    if (allowedFields.includes(el)) filteredBody[el] = req.body[el];
  });

  // Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: {
      user: updatedUser
    }
  });
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = catchAsync(async (req, res, next) => {
  // Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  // Update user verification status
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'Email verified successfully'
  });
});

// @desc    Resend email verification
// @route   POST /api/auth/resend-verification
// @access  Private
const resendVerification = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (user.isEmailVerified) {
    return next(new AppError('Email is already verified', 400));
  }

  // Generate new verification token
  const verifyToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  try {
    // Send verification email (implement this in emailService)
    // await emailService.sendEmailVerification(user, verifyToken);

    res.status(200).json({
      success: true,
      message: 'Verification email sent'
    });
  } catch (error) {
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later.', 500)
    );
  }
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updatePassword,
  updateProfile,
  verifyEmail,
  resendVerification
};
