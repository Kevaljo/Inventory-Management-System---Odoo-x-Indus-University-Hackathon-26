const StockAdjustment = require('../models/StockAdjustment');
const Product = require('../models/Product');
const StockMove = require('../models/StockMove');
const Notification = require('../models/Notification');

const generateReference = async () => {
  const count = await StockAdjustment.countDocuments();
  return `ADJ-${String(count + 1).padStart(5, '0')}`;
};

// @desc    Get all adjustments
// @route   GET /api/adjustments
const getAdjustments = async (req, res) => {
  try {
    const adjustments = await StockAdjustment.find()
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku unitOfMeasure')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(adjustments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create adjustment (draft) with automatic recorded quantities
// @route   POST /api/adjustments
const createAdjustment = async (req, res) => {
  try {
    const reference = await generateReference();
    const { warehouse, location, items, reason } = req.body;

    // Build items with recorded quantities from current stock
    const enrichedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.product}` });
      }

      enrichedItems.push({
        product: item.product,
        recordedQty: product.totalStock,
        countedQty: item.countedQty,
        difference: item.countedQty - product.totalStock
      });
    }

    const adjustment = await StockAdjustment.create({
      reference,
      warehouse,
      location,
      items: enrichedItems,
      reason,
      createdBy: req.user._id
    });

    const populated = await StockAdjustment.findById(adjustment._id)
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku unitOfMeasure totalStock');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Validate adjustment — overrides stock with physical count
// @route   PUT /api/adjustments/:id/validate
const validateAdjustment = async (req, res) => {
  try {
    const adjustment = await StockAdjustment.findById(req.params.id);
    if (!adjustment) {
      return res.status(404).json({ message: 'Adjustment not found' });
    }
    if (adjustment.status === 'done') {
      return res.status(400).json({ message: 'Adjustment is already validated' });
    }
    if (adjustment.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot validate a cancelled adjustment' });
    }

    for (const item of adjustment.items) {
      const product = await Product.findById(item.product);
      if (!product) continue;

      const difference = item.countedQty - product.totalStock;

      // SET stock to physical count
      product.totalStock = item.countedQty;
      product.lastMovementDate = new Date();

      // Update stockPerLocation if warehouse specified
      if (adjustment.warehouse) {
        const warehouseId = adjustment.warehouse.toString();
        const locationStr = adjustment.location || 'Default';

        const locIdx = product.stockPerLocation.findIndex(
          (l) => l.warehouse.toString() === warehouseId && l.location === locationStr
        );
        if (locIdx >= 0) {
          product.stockPerLocation[locIdx].quantity = item.countedQty;
        } else {
          product.stockPerLocation.push({
            warehouse: adjustment.warehouse,
            location: locationStr,
            quantity: item.countedQty
          });
        }
      }

      await product.save();

      // Create stock move for the difference
      await StockMove.create({
        product: product._id,
        moveType: 'adjustment',
        reference: adjustment.reference,
        sourceDocument: `Stock Adjustment ${adjustment.reference}`,
        sourceLocation: 'Adjustment',
        destLocation: 'Adjustment',
        quantity: difference,
        warehouse: adjustment.warehouse || null,
        date: new Date(),
        createdBy: req.user._id
      });

      // Trigger low stock notification if needed
      if (product.totalStock <= product.reorderLevel && product.totalStock > 0) {
        await Notification.create({
          type: 'low_stock',
          title: `⚠️ LOW STOCK AFTER ADJUSTMENT: ${product.name}`,
          message: `After adjustment, ${product.name} (${product.sku}) has only ${product.totalStock} ${product.unitOfMeasure} left. Reorder level is ${product.reorderLevel}.`,
          severity: 'high',
          product: product._id,
          user: req.user._id,
          actionUrl: `/products/${product._id}`
        });
      }

      if (product.totalStock === 0) {
        await Notification.create({
          type: 'out_of_stock',
          title: `🚫 OUT OF STOCK AFTER ADJUSTMENT: ${product.name}`,
          message: `After adjustment, ${product.name} (${product.sku}) is completely out of stock!`,
          severity: 'critical',
          product: product._id,
          user: req.user._id,
          actionUrl: `/products/${product._id}`
        });
      }
    }

    adjustment.status = 'done';
    adjustment.validatedDate = new Date();
    await adjustment.save();

    const populated = await StockAdjustment.findById(adjustment._id)
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku unitOfMeasure totalStock');

    res.json({ message: 'Adjustment validated. Stock updated to physical count.', adjustment: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAdjustments, createAdjustment, validateAdjustment };
