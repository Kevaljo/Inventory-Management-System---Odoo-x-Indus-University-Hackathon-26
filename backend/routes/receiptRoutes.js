const express = require('express');
const router = express.Router();
const {
  getReceipts,
  getReceipt,
  createReceipt,
  updateReceipt,
  validateReceipt,
  cancelReceipt
} = require('../controllers/receiptController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getReceipts);
router.post('/', protect, createReceipt);
router.get('/:id', protect, getReceipt);
router.put('/:id', protect, updateReceipt);
router.put('/:id/validate', protect, validateReceipt);
router.put('/:id/cancel', protect, cancelReceipt);

module.exports = router;
