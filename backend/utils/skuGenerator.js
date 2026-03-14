/**
 * skuGenerator.js
 * Smart SKU auto-generator based on category + product name
 */

const generateCategoryPrefix = (categoryName) => {
  if (!categoryName) return 'GEN';

  // Remove special characters, trim
  const cleaned = categoryName.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const words = cleaned.split(/\s+/).filter(Boolean);

  if (words.length === 0) return 'GEN';

  if (words.length === 1) {
    return words[0].substring(0, 3).toUpperCase();
  } else {
    // Take first letter of each word, max 3
    return words
      .slice(0, 3)
      .map(w => w[0])
      .join('')
      .toUpperCase();
  }
};

const generateProductCode = (productName) => {
  if (!productName) return 'PRD';

  // Remove special characters, trim
  const cleaned = productName.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const words = cleaned.split(/\s+/).filter(Boolean);

  if (words.length === 0) return 'PRD';

  if (words.length === 1) {
    return words[0].substring(0, 3).toUpperCase();
  } else {
    // Take first letter of each word, max 3
    return words
      .slice(0, 3)
      .map(w => w[0])
      .join('')
      .toUpperCase();
  }
};

const generateSKU = async (categoryName, productName) => {
  const Product = require('../models/Product');

  const catPrefix = generateCategoryPrefix(categoryName);
  const prodCode = generateProductCode(productName);
  const basePrefix = `${catPrefix}-${prodCode}`;

  // Find the last product with matching SKU prefix
  const lastProduct = await Product.findOne({
    sku: { $regex: `^${basePrefix}-`, $options: 'i' }
  }).sort({ sku: -1 });

  let sequence = 1;
  if (lastProduct) {
    const parts = lastProduct.sku.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      sequence = lastNum + 1;
    }
  }

  const paddedSeq = String(sequence).padStart(3, '0');
  return `${basePrefix}-${paddedSeq}`;
};

const isValidSKU = (sku) => {
  return /^[A-Z]{2,4}-[A-Z]{2,4}-\d{3,}$/.test(sku);
};

module.exports = { generateCategoryPrefix, generateProductCode, generateSKU, isValidSKU };
