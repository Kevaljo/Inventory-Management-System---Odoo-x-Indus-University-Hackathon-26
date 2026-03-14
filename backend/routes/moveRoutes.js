const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const StockMove = require('../models/StockMove');
const { detectDeadStock, generateRecommendations } = require('../utils/stockAnalyzer');

// @desc    Get stock moves with optional filters
// @route   GET /api/moves
router.get('/', protect, async (req, res) => {
  try {
    const { moveType, product, warehouse, startDate, endDate } = req.query;
    const filter = {};

    if (moveType) filter.moveType = moveType;
    if (product) filter.product = product;
    if (warehouse) filter.warehouse = warehouse;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const moves = await StockMove.find(filter)
      .populate('product', 'name sku')
      .populate('warehouse', 'name code')
      .populate('createdBy', 'name')
      .sort({ date: -1 });

    res.json(moves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get dead stock analysis
// @route   GET /api/moves/dead-stock
router.get('/dead-stock', protect, async (req, res) => {
  try {
    const deadStock = await detectDeadStock();
    res.json({ count: deadStock.length, deadStock });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get smart stock recommendations
// @route   GET /api/moves/recommendations
router.get('/recommendations', protect, async (req, res) => {
  try {
    const recommendations = await generateRecommendations();
    res.json({ count: recommendations.length, recommendations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
