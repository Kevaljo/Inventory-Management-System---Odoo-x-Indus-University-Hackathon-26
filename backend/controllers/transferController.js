const InternalTransfer = require('../models/InternalTransfer');
const Product = require('../models/Product');
const StockMove = require('../models/StockMove');

const generateReference = async () => {
  const count = await InternalTransfer.countDocuments();
  return `INT-${String(count + 1).padStart(5, '0')}`;
};

// @desc    Get all transfers
// @route   GET /api/transfers
const getTransfers = async (req, res) => {
  try {
    const transfers = await InternalTransfer.find()
      .populate('sourceWarehouse', 'name code')
      .populate('destWarehouse', 'name code')
      .populate('items.product', 'name sku unitOfMeasure totalStock')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(transfers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single transfer
// @route   GET /api/transfers/:id
const getTransfer = async (req, res) => {
  try {
    const transfer = await InternalTransfer.findById(req.params.id)
      .populate('sourceWarehouse', 'name code')
      .populate('destWarehouse', 'name code')
      .populate('items.product', 'name sku unitOfMeasure totalStock')
      .populate('createdBy', 'name');
    if (!transfer) {
      return res.status(404).json({ message: 'Transfer not found' });
    }
    res.json(transfer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create internal transfer
// @route   POST /api/transfers
const createTransfer = async (req, res) => {
  try {
    const reference = await generateReference();
    const {
      sourceWarehouse, sourceLocation, destWarehouse, destLocation,
      items, scheduledDate, notes
    } = req.body;

    const transfer = await InternalTransfer.create({
      reference,
      sourceWarehouse,
      sourceLocation,
      destWarehouse,
      destLocation,
      items,
      scheduledDate,
      notes,
      createdBy: req.user._id
    });

    res.status(201).json(transfer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Validate internal transfer
// @route   PUT /api/transfers/:id/validate
const validateTransfer = async (req, res) => {
  try {
    const transfer = await InternalTransfer.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({ message: 'Transfer not found' });
    }
    if (transfer.status === 'done') {
      return res.status(400).json({ message: 'Transfer is already validated' });
    }
    if (transfer.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot validate a cancelled transfer' });
    }

    const srcWarehouseId = transfer.sourceWarehouse.toString();
    const srcLocation = transfer.sourceLocation || 'Default';
    const dstWarehouseId = transfer.destWarehouse.toString();
    const dstLocation = transfer.destLocation || 'Default';

    // Check source availability for all items first
    for (const item of transfer.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.product}` });
      }

      const srcLoc = product.stockPerLocation.find(
        (l) => l.warehouse.toString() === srcWarehouseId && l.location === srcLocation
      );

      if (!srcLoc || srcLoc.quantity < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock at source location for ${product.name}. Available: ${srcLoc ? srcLoc.quantity : 0}, Required: ${item.quantity}`
        });
      }
    }

    // Apply transfers
    for (const item of transfer.items) {
      const product = await Product.findById(item.product);

      // Decrease source location
      const srcLocIdx = product.stockPerLocation.findIndex(
        (l) => l.warehouse.toString() === srcWarehouseId && l.location === srcLocation
      );
      product.stockPerLocation[srcLocIdx].quantity -= item.quantity;

      // Increase destination location
      const dstLocIdx = product.stockPerLocation.findIndex(
        (l) => l.warehouse.toString() === dstWarehouseId && l.location === dstLocation
      );
      if (dstLocIdx >= 0) {
        product.stockPerLocation[dstLocIdx].quantity += item.quantity;
      } else {
        product.stockPerLocation.push({
          warehouse: transfer.destWarehouse,
          location: dstLocation,
          quantity: item.quantity
        });
      }

      // totalStock remains unchanged (just moving between locations)
      product.lastMovementDate = new Date();
      product.isDeadStock = false;
      product.deadStockSince = null;
      await product.save();

      // Create stock move
      await StockMove.create({
        product: product._id,
        moveType: 'internal',
        reference: transfer.reference,
        sourceDocument: `Internal Transfer ${transfer.reference}`,
        sourceLocation: `${srcWarehouseId}/${srcLocation}`,
        destLocation: `${dstWarehouseId}/${dstLocation}`,
        quantity: item.quantity,
        warehouse: transfer.sourceWarehouse,
        date: new Date(),
        createdBy: req.user._id
      });
    }

    transfer.status = 'done';
    transfer.validatedDate = new Date();
    await transfer.save();

    const populated = await InternalTransfer.findById(transfer._id)
      .populate('sourceWarehouse', 'name code')
      .populate('destWarehouse', 'name code')
      .populate('items.product', 'name sku unitOfMeasure totalStock');

    res.json({ message: 'Transfer validated successfully.', transfer: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel transfer
// @route   PUT /api/transfers/:id/cancel
const cancelTransfer = async (req, res) => {
  try {
    const transfer = await InternalTransfer.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({ message: 'Transfer not found' });
    }
    if (transfer.status === 'done') {
      return res.status(400).json({ message: 'Cannot cancel a validated transfer' });
    }
    if (transfer.status === 'cancelled') {
      return res.status(400).json({ message: 'Transfer is already cancelled' });
    }

    transfer.status = 'cancelled';
    await transfer.save();
    res.json({ message: 'Transfer cancelled', transfer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTransfers, getTransfer, createTransfer, validateTransfer, cancelTransfer };
