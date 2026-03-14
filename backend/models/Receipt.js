const mongoose = require('mongoose');

const receiptItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    orderedQty: { type: Number, required: true },
    receivedQty: { type: Number, default: 0 }
  },
  { _id: false }
);

const receiptSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    supplier: { type: String, required: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    location: { type: String },
    items: [receiptItemSchema],
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

module.exports = mongoose.model('Receipt', receiptSchema);
