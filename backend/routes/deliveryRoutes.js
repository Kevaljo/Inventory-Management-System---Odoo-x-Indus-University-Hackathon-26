const express = require('express');
const router = express.Router();
const {
  getDeliveries,
  getDelivery,
  createDelivery,
  updateDelivery,
  validateDelivery,
  cancelDelivery
} = require('../controllers/deliveryController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getDeliveries);
router.post('/', protect, createDelivery);
router.get('/:id', protect, getDelivery);
router.put('/:id', protect, updateDelivery);
router.put('/:id/validate', protect, validateDelivery);
router.put('/:id/cancel', protect, cancelDelivery);

module.exports = router;
