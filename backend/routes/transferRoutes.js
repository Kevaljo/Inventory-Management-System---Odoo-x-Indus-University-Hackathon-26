const express = require('express');
const router = express.Router();
const {
  getTransfers,
  getTransfer,
  createTransfer,
  validateTransfer,
  cancelTransfer
} = require('../controllers/transferController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getTransfers);
router.post('/', protect, createTransfer);
router.get('/:id', protect, getTransfer);
router.put('/:id/validate', protect, validateTransfer);
router.put('/:id/cancel', protect, cancelTransfer);

module.exports = router;
