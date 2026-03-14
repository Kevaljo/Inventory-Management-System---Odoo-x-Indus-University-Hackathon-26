const DeliveryOrder = require('../models/DeliveryOrder');
const Product = require('../models/Product');
const StockMove = require('../models/StockMove');
const Notification = require('../models/Notification');

const generateReference = async () => {
  const count = await DeliveryOrder.countDocuments();
  return `DEL-${String(count + 1).padStart(5, '0')}`;
};

// @desc    Get all deliveries
// @route   GET /api/deliveries
const getDeliveries = async (req, res) => {
  try {
    const deliveries = await DeliveryOrder.find()
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku unitOfMeasure totalStock')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(deliveries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single delivery
// @route   GET /api/deliveries/:id
const getDelivery = async (req, res) => {
  try {
    const delivery = await DeliveryOrder.findById(req.params.id)
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku unitOfMeasure totalStock')
      .populate('createdBy', 'name');
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery order not found' });
    }
    res.json(delivery);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create delivery order
// @route   POST /api/deliveries
const createDelivery = async (req, res) => {
  try {
    const reference = await generateReference();
    const { customer, warehouse, location, items, scheduledDate, notes } = req.body;

    const delivery = await DeliveryOrder.create({
      reference,
      customer,
      warehouse,
      location,
      items,
      scheduledDate,
      notes,
      createdBy: req.user._id
    });

    res.status(201).json(delivery);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update delivery order
// @route   PUT /api/deliveries/:id
const updateDelivery = async (req, res) => {
  try {
    const delivery = await DeliveryOrder.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery order not found' });
    }
    if (delivery.status === 'done' || delivery.status === 'cancelled') {
      return res.status(400).json({ message: `Cannot edit a delivery with status '${delivery.status}'` });
    }

    const { customer, warehouse, location, items, scheduledDate, notes, status } = req.body;
    if (customer) delivery.customer = customer;
    if (warehouse) delivery.warehouse = warehouse;
    if (location !== undefined) delivery.location = location;
    if (items) delivery.items = items;
    if (scheduledDate) delivery.scheduledDate = scheduledDate;
    if (notes !== undefined) delivery.notes = notes;
    if (status) delivery.status = status;

    const updated = await delivery.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Validate delivery — decreases stock
// @route   PUT /api/deliveries/:id/validate
const validateDelivery = async (req, res) => {
  try {
    const delivery = await DeliveryOrder.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery order not found' });
    }
    if (delivery.status === 'done') {
      return res.status(400).json({ message: 'Delivery is already validated' });
    }
    if (delivery.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot validate a cancelled delivery' });
    }

    // FIRST PASS: Check stock availability for ALL items
    for (const item of delivery.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.product}` });
      }

      const qty = item.deliveredQty > 0 ? item.deliveredQty : item.demandQty;
      if (product.totalStock < qty) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${product.totalStock}, Required: ${qty}`
        });
      }
    }

    // SECOND PASS: Apply stock changes
    const alerts = [];

    for (const item of delivery.items) {
      const product = await Product.findById(item.product);
      const qty = item.deliveredQty > 0 ? item.deliveredQty : item.demandQty;
      const locationStr = delivery.location || 'Default';

      // Decrease total stock
      product.totalStock -= qty;

      // Update lastMovementDate and clear dead stock flags
      product.lastMovementDate = new Date();
      product.isDeadStock = false;
      product.deadStockSince = null;

      // Update stockPerLocation (decrease at location)
      const warehouseId = delivery.warehouse.toString();
      const locIdx = product.stockPerLocation.findIndex(
        (l) => l.warehouse.toString() === warehouseId && l.location === locationStr
      );
      if (locIdx >= 0) {
        product.stockPerLocation[locIdx].quantity = Math.max(
          0,
          product.stockPerLocation[locIdx].quantity - qty
        );
      }

      await product.save();

      // Check LOW STOCK notification
      if (product.totalStock <= product.reorderLevel && product.totalStock > 0) {
        alerts.push({
          product: product.name,
          type: 'low_stock',
          stock: product.totalStock,
          reorderLevel: product.reorderLevel
        });
        await Notification.create({
          type: 'low_stock',
          title: `⚠️ LOW STOCK: ${product.name}`,
          message: `${product.name} (${product.sku}) is running low. Current stock: ${product.totalStock} ${product.unitOfMeasure}. Reorder level: ${product.reorderLevel}.`,
          severity: 'high',
          product: product._id,
          user: req.user._id,
          actionUrl: `/products/${product._id}`
        });
      }

      // Check OUT OF STOCK notification
      if (product.totalStock === 0) {
        alerts.push({ product: product.name, type: 'out_of_stock', stock: 0 });
        await Notification.create({
          type: 'out_of_stock',
          title: `🚫 OUT OF STOCK: ${product.name}`,
          message: `${product.name} (${product.sku}) is completely out of stock! Immediate reorder required.`,
          severity: 'critical',
          product: product._id,
          user: req.user._id,
          actionUrl: `/products/${product._id}`
        });
      }

      // Create stock move (negative quantity = outbound)
      await StockMove.create({
        product: product._id,
        moveType: 'delivery',
        reference: delivery.reference,
        sourceDocument: `Delivery to ${delivery.customer}`,
        sourceLocation: locationStr,
        destLocation: 'Customer',
        quantity: -qty,
        warehouse: delivery.warehouse,
        date: new Date(),
        createdBy: req.user._id
      });
    }

    delivery.status = 'done';
    delivery.validatedDate = new Date();
    await delivery.save();

    const populated = await DeliveryOrder.findById(delivery._id)
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku unitOfMeasure totalStock');

    const response = { message: 'Delivery validated successfully. Stock updated.', delivery: populated };
    if (alerts.length > 0) response.alerts = alerts;

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel delivery
// @route   PUT /api/deliveries/:id/cancel
const cancelDelivery = async (req, res) => {
  try {
    const delivery = await DeliveryOrder.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery order not found' });
    }
    if (delivery.status === 'done') {
      return res.status(400).json({ message: 'Cannot cancel a validated delivery' });
    }
    if (delivery.status === 'cancelled') {
      return res.status(400).json({ message: 'Delivery is already cancelled' });
    }

    delivery.status = 'cancelled';
    await delivery.save();
    res.json({ message: 'Delivery order cancelled', delivery });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDeliveries, getDelivery, createDelivery, updateDelivery, validateDelivery, cancelDelivery };
