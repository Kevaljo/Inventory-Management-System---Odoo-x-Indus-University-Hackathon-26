const mongoose = require('mongoose');

const transferItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true }
  },
  { _id: false }
);

const internalTransferSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    sourceWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    sourceLocation: { type: String },
    destWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    destLocation: { type: String },
    items: [transferItemSchema],
    status: {
      type: String,
      enum: ['draft', 'waiting', 'ready', 'done', 'cancelled'],
      default: 'draft'
    },
    scheduledDate: { type: Date },
    validatedDate: { type: Date },
    notes: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('InternalTransfer', internalTransferSchema);
