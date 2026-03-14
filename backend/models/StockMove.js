const mongoose = require('mongoose');

const stockMoveSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    moveType: {
      type: String,
      enum: ['receipt', 'delivery', 'internal', 'adjustment'],
      required: true
    },
    reference: { type: String },
    sourceDocument: { type: String },
    sourceLocation: { type: String },
    destLocation: { type: String },
    quantity: { type: Number, required: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    date: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

stockMoveSchema.index({ product: 1, date: -1 });
stockMoveSchema.index({ moveType: 1 });

module.exports = mongoose.model('StockMove', stockMoveSchema);
