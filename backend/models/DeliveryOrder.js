const mongoose = require('mongoose');

const deliveryItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    demandQty: { type: Number, required: true },
    deliveredQty: { type: Number, default: 0 }
  },
  { _id: false }
);

const deliveryOrderSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    customer: { type: String, required: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    location: { type: String },
    items: [deliveryItemSchema],
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

module.exports = mongoose.model('DeliveryOrder', deliveryOrderSchema);
