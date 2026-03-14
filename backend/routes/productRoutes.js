const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  previewSKU,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getProducts);
router.post('/', protect, createProduct);
router.post('/preview-sku', protect, previewSKU);
router.get('/:id', protect, getProduct);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;
