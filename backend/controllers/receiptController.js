const Receipt = require('../models/Receipt');
const Product = require('../models/Product');
const StockMove = require('../models/StockMove');

const generateReference = async () => {
  const count = await Receipt.countDocuments();
  return `REC-${String(count + 1).padStart(5, '0')}`;
};

// @desc    Get all receipts
// @route   GET /api/receipts
const getReceipts = async (req, res) => {
  try {
    const receipts = await Receipt.find()
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku unitOfMeasure')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(receipts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single receipt
// @route   GET /api/receipts/:id
const getReceipt = async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id)
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku unitOfMeasure totalStock')
      .populate('createdBy', 'name');
    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }
    res.json(receipt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create receipt
// @route   POST /api/receipts
const createReceipt = async (req, res) => {
  try {
    const reference = await generateReference();
    const { supplier, warehouse, location, items, scheduledDate, notes } = req.body;

    const receipt = await Receipt.create({
      reference,
      supplier,
      warehouse,
      location,
      items,
      scheduledDate,
      notes,
      createdBy: req.user._id
    });

    res.status(201).json(receipt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update receipt (only if not done/cancelled)
// @route   PUT /api/receipts/:id
const updateReceipt = async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }
    if (receipt.status === 'done' || receipt.status === 'cancelled') {
      return res.status(400).json({ message: `Cannot edit a receipt with status '${receipt.status}'` });
    }

    const { supplier, warehouse, location, items, scheduledDate, notes, status } = req.body;
    if (supplier) receipt.supplier = supplier;
    if (warehouse) receipt.warehouse = warehouse;
    if (location !== undefined) receipt.location = location;
    if (items) receipt.items = items;
    if (scheduledDate) receipt.scheduledDate = scheduledDate;
    if (notes !== undefined) receipt.notes = notes;
    if (status) receipt.status = status;

    const updated = await receipt.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Validate receipt — increases stock
// @route   PUT /api/receipts/:id/validate
const validateReceipt = async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id).populate('items.product');
    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }
    if (receipt.status === 'done') {
      return res.status(400).json({ message: 'Receipt is already validated' });
    }
    if (receipt.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot validate a cancelled receipt' });
    }

    for (const item of receipt.items) {
      const product = await Product.findById(item.product._id || item.product);
      if (!product) continue;

      const qty = item.receivedQty > 0 ? item.receivedQty : item.orderedQty;

      // Increase total stock
      product.totalStock += qty;

      // Reset dead stock flags
      product.lastMovementDate = new Date();
      product.isDeadStock = false;
      product.deadStockSince = null;

      // Update stockPerLocation
      const warehouseId = receipt.warehouse.toString();
      const locationStr = receipt.location || 'Default';

      const locIdx = product.stockPerLocation.findIndex(
        (l) => l.warehouse.toString() === warehouseId && l.location === locationStr
      );

      if (locIdx >= 0) {
        product.stockPerLocation[locIdx].quantity += qty;
      } else {
        product.stockPerLocation.push({
          warehouse: receipt.warehouse,
          location: locationStr,
          quantity: qty
        });
      }

      await product.save();

      // Create stock move record
      await StockMove.create({
        product: product._id,
        moveType: 'receipt',
        reference: receipt.reference,
        sourceDocument: `Receipt from ${receipt.supplier}`,
        sourceLocation: 'Vendor',
        destLocation: locationStr,
        quantity: qty,
        warehouse: receipt.warehouse,
        date: new Date(),
        createdBy: req.user._id
      });
    }

    receipt.status = 'done';
    receipt.validatedDate = new Date();
    await receipt.save();

    const populated = await Receipt.findById(receipt._id)
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku unitOfMeasure totalStock');

    res.json({ message: 'Receipt validated successfully. Stock updated.', receipt: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel receipt
// @route   PUT /api/receipts/:id/cancel
const cancelReceipt = async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }
    if (receipt.status === 'done') {
      return res.status(400).json({ message: 'Cannot cancel a validated receipt' });
    }
    if (receipt.status === 'cancelled') {
      return res.status(400).json({ message: 'Receipt is already cancelled' });
    }

    receipt.status = 'cancelled';
    await receipt.save();
    res.json({ message: 'Receipt cancelled', receipt });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getReceipts, getReceipt, createReceipt, updateReceipt, validateReceipt, cancelReceipt };
