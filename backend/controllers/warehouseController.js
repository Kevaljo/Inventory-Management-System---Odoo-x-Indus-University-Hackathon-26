const Warehouse = require('../models/Warehouse');

// @desc    Get all active warehouses
// @route   GET /api/warehouses
const getWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.find({ isActive: true });
    res.json(warehouses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single warehouse
// @route   GET /api/warehouses/:id
const getWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }
    res.json(warehouse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a warehouse
// @route   POST /api/warehouses
const createWarehouse = async (req, res) => {
  try {
    const { name, code, address, country, state, city, locations } = req.body;

    const existing = await Warehouse.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: 'Warehouse code already exists' });
    }

    const warehouse = await Warehouse.create({
      name,
      code: code.toUpperCase(),
      address,
      country,
      state,
      city,
      locations: locations || []
    });

    res.status(201).json(warehouse);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Warehouse code already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a warehouse
// @route   PUT /api/warehouses/:id
const updateWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }

    const { name, address, country, state, city, locations } = req.body;
    if (name) warehouse.name = name;
    if (address !== undefined) warehouse.address = address;
    if (country !== undefined) warehouse.country = country;
    if (state !== undefined) warehouse.state = state;
    if (city !== undefined) warehouse.city = city;
    if (locations) warehouse.locations = locations;

    const updated = await warehouse.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Soft delete a warehouse
// @route   DELETE /api/warehouses/:id
const deleteWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }

    warehouse.isActive = false;
    await warehouse.save();

    res.json({ message: 'Warehouse deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getWarehouses, getWarehouse, createWarehouse, updateWarehouse, deleteWarehouse };
