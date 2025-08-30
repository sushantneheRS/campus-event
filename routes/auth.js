const express = require('express');
const router = express.Router();

// Import middleware
const { protect } = require('../middleware/auth');
const {
  validateUserRegistration,
  validateUserLogin,
  validatePasswordUpdate
} = require('../middleware/validation');

// Import controllers
const {
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
} = require('../controllers/authController');

// Public routes
router.post('/register', validateUserRegistration, register);
router.post('/login', validateUserLogin, login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resetToken', resetPassword);
router.get('/verify-email/:token', verifyEmail);

// Protected routes
router.get('/me', protect, getMe);
router.put('/update-password', protect, validatePasswordUpdate, updatePassword);
router.put('/update-profile', protect, updateProfile);
router.post('/resend-verification', protect, resendVerification);

module.exports = router;
