const Category = require('../models/Category');
const Product = require('../models/Product');

// Helper: generate unique code
const makeUniqueCode = (base) => {
  return base; // uniqueness check done in controller
};

// @desc    Get all categories
// @route   GET /api/categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate('parentCategory', 'name code');

    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await Product.countDocuments({ category: cat._id });
        return { ...cat.toObject(), productCount };
      })
    );

    res.json(categoriesWithCount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Recursive helper to build tree
const buildTree = async (parentId) => {
  const children = await Category.find({ parentCategory: parentId });
  const result = [];

  for (const child of children) {
    const productCount = await Product.countDocuments({ category: child._id });
    const subChildren = await buildTree(child._id);
    result.push({
      ...child.toObject(),
      productCount,
      children: subChildren
    });
  }

  return result;
};

// @desc    Get category tree
// @route   GET /api/categories/tree
const getCategoryTree = async (req, res) => {
  try {
    const roots = await Category.find({ parentCategory: null });
    const tree = [];

    for (const root of roots) {
      const productCount = await Product.countDocuments({ category: root._id });
      const children = await buildTree(root._id);
      tree.push({
        ...root.toObject(),
        productCount,
        children
      });
    }

    res.json(tree);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a category
// @route   POST /api/categories
const createCategory = async (req, res) => {
  try {
    const { name, description, parentCategory, icon, color } = req.body;

    // Generate base code from name
    const cleaned = name.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    const words = cleaned.split(/\s+/).filter(Boolean);
    let baseCode =
      words.length === 1
        ? words[0].substring(0, 3).toUpperCase()
        : words.slice(0, 3).map((w) => w[0]).join('').toUpperCase();

    // Check uniqueness, increment if duplicate
    let code = baseCode;
    let counter = 1;
    while (await Category.findOne({ code })) {
      code = `${baseCode}${counter}`;
      counter++;
    }

    const category = await Category.create({
      name,
      code,
      description,
      parentCategory: parentCategory || null,
      icon,
      color
    });

    res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Category name already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const { name, description, parentCategory, icon, color, isActive } = req.body;

    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (parentCategory !== undefined) category.parentCategory = parentCategory || null;
    if (icon) category.icon = icon;
    if (color) category.color = color;
    if (isActive !== undefined) category.isActive = isActive;

    const updated = await category.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if products exist in this category
    const productCount = await Product.countDocuments({ category: req.params.id });
    if (productCount > 0) {
      return res
        .status(400)
        .json({ message: `Cannot delete: ${productCount} product(s) belong to this category` });
    }

    // Check for child categories
    const childCount = await Category.countDocuments({ parentCategory: req.params.id });
    if (childCount > 0) {
      return res
        .status(400)
        .json({ message: `Cannot delete: ${childCount} sub-category(ies) exist under this category` });
    }

    await category.deleteOne();
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get category by ID
// @route   GET /api/categories/:id
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCategories, getCategoryById, getCategoryTree, createCategory, updateCategory, deleteCategory };
