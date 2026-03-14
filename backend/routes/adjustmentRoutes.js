const express = require('express');
const router = express.Router();
const {
  getAdjustments,
  createAdjustment,
  validateAdjustment
} = require('../controllers/adjustmentController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getAdjustments);
router.post('/', protect, createAdjustment);
router.put('/:id/validate', protect, validateAdjustment);

module.exports = router;
