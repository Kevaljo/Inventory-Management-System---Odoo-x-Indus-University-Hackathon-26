const Product = require('../models/Product');
const Category = require('../models/Category');
const Receipt = require('../models/Receipt');
const DeliveryOrder = require('../models/DeliveryOrder');
const InternalTransfer = require('../models/InternalTransfer');
const StockMove = require('../models/StockMove');
const Notification = require('../models/Notification');
const { calculateStockHealth } = require('../utils/stockAnalyzer');

// @desc    Get full dashboard data
// @route   GET /api/dashboard
const getDashboard = async (req, res) => {
  try {
    const pendingStatuses = ['draft', 'waiting', 'ready'];

    // KPIs — run concurrently
    const [
      totalProducts,
      lowStockItems,
      outOfStockItems,
      pendingReceipts,
      pendingDeliveries,
      scheduledTransfers,
      deadStockCount,
      totalCategories,
      unreadNotifications
    ] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({
        isActive: true,
        totalStock: { $gt: 0 },
        $expr: { $lte: ['$totalStock', '$reorderLevel'] }
      }),
      Product.countDocuments({ isActive: true, totalStock: 0 }),
      Receipt.countDocuments({ status: { $in: pendingStatuses } }),
      DeliveryOrder.countDocuments({ status: { $in: pendingStatuses } }),
      InternalTransfer.countDocuments({ status: { $in: pendingStatuses } }),
      Product.countDocuments({ isDeadStock: true }),
      Category.countDocuments({ isActive: true }),
      Notification.countDocuments({ user: req.user._id, isRead: false })
    ]);

    // Stock health score
    const stockHealth = await calculateStockHealth();

    // Recent stock moves (last 10)
    const recentMoves = await StockMove.find()
      .populate('product', 'name sku')
      .populate('warehouse', 'name code')
      .populate('createdBy', 'name')
      .sort({ date: -1 })
      .limit(10);

    // Low stock products (limit 10)
    const lowStockProducts = await Product.find({
      isActive: true,
      totalStock: { $gt: 0 },
      $expr: { $lte: ['$totalStock', '$reorderLevel'] }
    })
      .populate('category', 'name code icon color')
      .limit(10);

    // Category stats — aggregate product count and total stock per category
    const categoryStats = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          productCount: { $sum: 1 },
          totalStock: { $sum: '$totalStock' }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          categoryName: { $ifNull: ['$category.name', 'Uncategorized'] },
          categoryIcon: { $ifNull: ['$category.icon', '📦'] },
          categoryColor: { $ifNull: ['$category.color', '#6B7280'] },
          productCount: 1,
          totalStock: 1
        }
      }
    ]);

    res.json({
      kpis: {
        totalProducts,
        lowStockItems,
        outOfStockItems,
        pendingReceipts,
        pendingDeliveries,
        scheduledTransfers,
        deadStockCount,
        totalCategories,
        unreadNotifications
      },
      stockHealth,
      recentMoves,
      lowStockProducts,
      categoryStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboard };
