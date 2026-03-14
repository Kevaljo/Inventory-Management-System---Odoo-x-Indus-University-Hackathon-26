const express = require('express');
const router = express.Router();
const {
  getWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse
} = require('../controllers/warehouseController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getWarehouses);
router.post('/', protect, createWarehouse);
router.get('/:id', protect, getWarehouse);
router.put('/:id', protect, updateWarehouse);
router.delete('/:id', protect, deleteWarehouse);

module.exports = router;
