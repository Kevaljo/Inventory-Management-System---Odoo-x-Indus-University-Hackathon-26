const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['low_stock', 'out_of_stock', 'dead_stock', 'reorder', 'overstock', 'system'],
      required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    severity: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low', 'info'],
      default: 'info'
    },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actionUrl: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
