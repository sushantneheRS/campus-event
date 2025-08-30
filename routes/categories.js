const express = require('express');
const router = express.Router();

// Import middleware
const { protect, authorize } = require('../middleware/auth');
const { 
  validateCategoryCreation,
  validatePagination,
  validateObjectId 
} = require('../middleware/validation');

// Import controllers (will be created next)
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats
} = require('../controllers/categoryController');

// Public routes
router.get('/', validatePagination, getCategories);
router.get('/:id', validateObjectId, getCategory);

// Protected routes - Admin only
router.use(protect);
router.use(authorize('admin'));

router.post('/', validateCategoryCreation, createCategory);

router
  .route('/:id')
  .put(validateObjectId, updateCategory)
  .delete(validateObjectId, deleteCategory);

router.get('/admin/stats', getCategoryStats);

module.exports = router;
