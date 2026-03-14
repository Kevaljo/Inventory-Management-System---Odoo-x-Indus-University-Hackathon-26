const mongoose = require('mongoose');

const adjustmentItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    recordedQty: { type: Number },
    countedQty: { type: Number, required: true },
    difference: { type: Number }
  },
  { _id: false }
);

const stockAdjustmentSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    location: { type: String },
    items: [adjustmentItemSchema],
    reason: { type: String },
    status: {
      type: String,
      enum: ['draft', 'done', 'cancelled'],
      default: 'draft'
    },
    validatedDate: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('StockAdjustment', stockAdjustmentSchema);
