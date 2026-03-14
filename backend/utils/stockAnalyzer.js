/**
 * stockAnalyzer.js
 * Dead stock detection, smart recommendations, and stock health scoring
 */

const detectDeadStock = async () => {
  const Product = require('../models/Product');
  const StockMove = require('../models/StockMove');

  const deadStockDays = parseInt(process.env.DEAD_STOCK_DAYS) || 30;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - deadStockDays);

  const products = await Product.find({ totalStock: { $gt: 0 } }).populate('category', 'name');

  const deadStockList = [];

  for (const product of products) {
    // Find most recent stock move for this product
    const lastMove = await StockMove.findOne({ product: product._id }).sort({ date: -1 });

    const lastMoveDate = lastMove ? lastMove.date : product.createdAt;
    const now = new Date();
    const diffTime = Math.abs(now - new Date(lastMoveDate));
    const daysSinceLastMove = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (daysSinceLastMove >= deadStockDays) {
      let severity;
      let recommendation;

      if (daysSinceLastMove > 90) {
        severity = 'critical';
        recommendation = 'Consider liquidating or writing off this stock';
      } else if (daysSinceLastMove > 60) {
        severity = 'high';
        recommendation = 'Review demand forecast and consider promotional pricing';
      } else {
        severity = 'medium';
        recommendation = 'Monitor closely - approaching dead stock threshold';
      }

      deadStockList.push({
        product: {
          _id: product._id,
          name: product.name,
          sku: product.sku,
          category: product.category ? product.category.name : 'Uncategorized',
          totalStock: product.totalStock,
          unitOfMeasure: product.unitOfMeasure
        },
        lastMoveDate,
        daysSinceLastMove,
        stockValue: product.totalStock * (product.costPrice || 0),
        severity,
        recommendation
      });
    }
  }

  // Sort by daysSinceLastMove descending
  deadStockList.sort((a, b) => b.daysSinceLastMove - a.daysSinceLastMove);

  return deadStockList;
};

const generateRecommendations = async () => {
  const Product = require('../models/Product');
  const StockMove = require('../models/StockMove');

  const products = await Product.find({ isActive: true }).populate('category', 'name');
  const recommendations = [];

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

  for (const product of products) {
    const {
      _id,
      name,
      sku,
      totalStock,
      reorderLevel,
      reorderQty,
      unitOfMeasure,
      costPrice
    } = product;

    // Calculate average daily consumption over last 30 days
    const outboundMoves = await StockMove.find({
      product: _id,
      moveType: { $in: ['delivery', 'internal'] },
      date: { $gte: thirtyDaysAgo },
      quantity: { $lt: 0 }
    });

    const totalConsumed = outboundMoves.reduce((sum, m) => sum + Math.abs(m.quantity), 0);
    const avgDailyConsumption = totalConsumed / 30;

    const daysOfStockLeft =
      avgDailyConsumption > 0
        ? Math.floor(totalStock / avgDailyConsumption)
        : Infinity;

    const productInfo = {
      _id,
      name,
      sku,
      category: product.category ? product.category.name : 'Uncategorized',
      unitOfMeasure
    };

    // Out of stock
    if (totalStock === 0) {
      recommendations.push({
        product: productInfo,
        type: 'out_of_stock',
        severity: 'critical',
        icon: '🚫',
        title: `OUT OF STOCK: ${name}`,
        message: `${name} (${sku}) is completely out of stock! Immediate reorder required.`,
        suggestedAction: `Order at least ${reorderQty} ${unitOfMeasure}`,
        currentStock: totalStock,
        reorderLevel,
        suggestedQty: reorderQty,
        avgDailyConsumption: parseFloat(avgDailyConsumption.toFixed(2)),
        daysOfStockLeft: 0
      });
    }
    // Below minimum / reorder level
    else if (totalStock > 0 && totalStock <= reorderLevel) {
      const severity = totalStock <= reorderLevel / 2 ? 'high' : 'medium';
      recommendations.push({
        product: productInfo,
        type: 'below_minimum',
        severity,
        icon: '⚠️',
        title: `LOW STOCK: ${name}`,
        message: `${name} (${sku}) has only ${totalStock} ${unitOfMeasure} left. Minimum level is ${reorderLevel}.`,
        suggestedAction: `Order ${reorderQty} ${unitOfMeasure} to maintain safe stock levels`,
        currentStock: totalStock,
        reorderLevel,
        suggestedQty: reorderQty,
        avgDailyConsumption: parseFloat(avgDailyConsumption.toFixed(2)),
        daysOfStockLeft: daysOfStockLeft === Infinity ? null : daysOfStockLeft
      });
    }
    // Running low based on consumption trends
    else if (daysOfStockLeft <= 7 && daysOfStockLeft !== Infinity && totalStock > reorderLevel) {
      recommendations.push({
        product: productInfo,
        type: 'running_low',
        severity: 'medium',
        icon: '📉',
        title: `RUNNING LOW: ${name}`,
        message: `Based on consumption trends, ${name} will run out in approximately ${daysOfStockLeft} days.`,
        suggestedAction: `Plan reorder of ${reorderQty} ${unitOfMeasure} within ${Math.max(1, daysOfStockLeft - 2)} days`,
        currentStock: totalStock,
        reorderLevel,
        suggestedQty: reorderQty,
        avgDailyConsumption: parseFloat(avgDailyConsumption.toFixed(2)),
        daysOfStockLeft
      });
    }
    // Overstock
    else if (totalStock > reorderQty * 5) {
      recommendations.push({
        product: productInfo,
        type: 'overstock',
        severity: 'low',
        icon: '📦',
        title: `OVERSTOCK: ${name}`,
        message: `${name} has ${totalStock} ${unitOfMeasure} which is significantly above normal levels.`,
        suggestedAction: 'Consider reducing future orders or redistributing to other locations',
        currentStock: totalStock,
        reorderLevel,
        suggestedQty: reorderQty,
        avgDailyConsumption: parseFloat(avgDailyConsumption.toFixed(2)),
        daysOfStockLeft: daysOfStockLeft === Infinity ? null : daysOfStockLeft
      });
    }
  }

  // Sort by severity
  recommendations.sort(
    (a, b) => (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99)
  );

  return recommendations;
};

const calculateStockHealth = async () => {
  const Product = require('../models/Product');

  const totalProducts = await Product.countDocuments({ isActive: true });

  if (totalProducts === 0) {
    return {
      score: 100,
      label: 'Excellent',
      color: 'green',
      totalProducts: 0,
      healthyProducts: 0,
      unhealthyProducts: 0
    };
  }

  const healthyCount = await Product.countDocuments({
    isActive: true,
    $expr: { $gt: ['$totalStock', '$reorderLevel'] }
  });

  const score = Math.round((healthyCount / totalProducts) * 100);
  const unhealthyProducts = totalProducts - healthyCount;

  let label;
  let color;

  if (score >= 80) {
    label = 'Excellent';
    color = 'green';
  } else if (score >= 60) {
    label = 'Good';
    color = 'blue';
  } else if (score >= 40) {
    label = 'Fair';
    color = 'yellow';
  } else {
    label = 'Poor';
    color = 'red';
  }

  return {
    score,
    label,
    color,
    totalProducts,
    healthyProducts: healthyCount,
    unhealthyProducts
  };
};

module.exports = { detectDeadStock, generateRecommendations, calculateStockHealth };
