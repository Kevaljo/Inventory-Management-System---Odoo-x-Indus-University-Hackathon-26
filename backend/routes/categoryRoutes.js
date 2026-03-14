const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategoryById,
  getCategoryTree,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getCategories);
router.get('/tree', protect, getCategoryTree);
router.get('/:id', protect, getCategoryById);
router.post('/', protect, createCategory);
router.put('/:id', protect, updateCategory);
router.delete('/:id', protect, deleteCategory);

module.exports = router;
