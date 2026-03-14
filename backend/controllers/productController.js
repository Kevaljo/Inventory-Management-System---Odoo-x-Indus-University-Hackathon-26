const Product = require('../models/Product');
const Category = require('../models/Category');
const { generateSKU, generateCategoryPrefix } = require('../utils/skuGenerator');

// @desc    Get all products
// @route   GET /api/products
const getProducts = async (req, res) => {
  try {
    const { search, category, lowStock, outOfStock, deadStock } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (lowStock === 'true') {
      filter.$expr = { $lte: ['$totalStock', '$reorderLevel'] };
      filter.totalStock = { $gt: 0 };
    }

    if (outOfStock === 'true') {
      filter.totalStock = 0;
    }

    if (deadStock === 'true') {
      filter.isDeadStock = true;
    }

    const products = await Product.find(filter)
      .populate('category', 'name code icon color')
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      'category',
      'name code icon color'
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
const createProduct = async (req, res) => {
  try {
    let {
      name,
      sku,
      category,
      unitOfMeasure,
      totalStock,
      reorderLevel,
      reorderQty,
      description,
      image,
      costPrice,
      sellingPrice,
      weight,
      dimensions
    } = req.body;

    // Auto-generate SKU if not provided
    if (!sku) {
      let categoryName = 'General';
      if (category) {
        const cat = await Category.findById(category);
        if (cat) categoryName = cat.name;
      }
      sku = await generateSKU(categoryName, name);
    }

    // Check SKU uniqueness
    const existingSKU = await Product.findOne({ sku });
    if (existingSKU) {
      return res.status(400).json({ message: 'SKU already exists' });
    }

    const product = await Product.create({
      name,
      sku,
      category: category || null,
      unitOfMeasure,
      totalStock: totalStock || 0,
      reorderLevel,
      reorderQty,
      description,
      image,
      costPrice,
      sellingPrice,
      weight,
      dimensions,
      lastMovementDate: new Date()
    });

    // Increment category productCount
    if (category) {
      await Category.findByIdAndUpdate(category, { $inc: { productCount: 1 } });
    }

    const populated = await Product.findById(product._id).populate(
      'category',
      'name code icon color'
    );

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Preview SKU before creation
// @route   POST /api/products/preview-sku
const previewSKU = async (req, res) => {
  try {
    const { categoryId, productName } = req.body;

    let categoryName = 'General';
    if (categoryId) {
      const cat = await Category.findById(categoryId);
      if (cat) categoryName = cat.name;
    }

    const sku = await generateSKU(categoryName, productName);
    const categoryPrefix = generateCategoryPrefix(categoryName);

    res.json({ sku, categoryPrefix });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const allowedFields = [
      'name', 'category', 'unitOfMeasure', 'reorderLevel', 'reorderQty',
      'description', 'image', 'costPrice', 'sellingPrice', 'weight',
      'dimensions', 'isActive', 'isDeadStock', 'deadStockSince'
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    }

    const updated = await product.save();
    const populated = await Product.findById(updated._id).populate(
      'category',
      'name code icon color'
    );

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Decrement category productCount
    if (product.category) {
      await Category.findByIdAndUpdate(product.category, { $inc: { productCount: -1 } });
    }

    await product.deleteOne();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProducts, getProduct, createProduct, previewSKU, updateProduct, deleteProduct };
