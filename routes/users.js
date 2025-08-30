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
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  uploadUserPhoto,
  resizeUserPhoto
} = require('../controllers/userController');

// All routes are protected and require admin role
router.use(protect);

// Routes accessible by all authenticated users
router.get('/stats', getUserStats);

// Admin only routes
router.use(authorize('admin'));

router
  .route('/')
  .get(validatePagination, getUsers)
  .post(createUser);

router
  .route('/:id')
  .get(validateObjectId, getUser)
  .put(validateObjectId, updateUser)
  .delete(validateObjectId, deleteUser);

// Photo upload route
router.post('/:id/photo', 
  validateObjectId,
  uploadUserPhoto,
  resizeUserPhoto,
  updateUser
);

module.exports = router;
