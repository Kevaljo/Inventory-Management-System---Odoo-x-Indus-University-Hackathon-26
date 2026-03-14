const mongoose = require('mongoose');

const stockPerLocationSchema = new mongoose.Schema(
  {
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    location: { type: String },
    quantity: { type: Number, default: 0 }
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    unitOfMeasure: { type: String, default: 'Units' },
    totalStock: { type: Number, default: 0 },
    stockPerLocation: [stockPerLocationSchema],
    reorderLevel: { type: Number, default: 10 },
    reorderQty: { type: Number, default: 50 },
    description: { type: String },
    image: { type: String },
    lastMovementDate: { type: Date, default: Date.now },
    isDeadStock: { type: Boolean, default: false },
    deadStockSince: { type: Date },
    costPrice: { type: Number, default: 0 },
    sellingPrice: { type: Number, default: 0 },
    weight: { type: Number },
    dimensions: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

productSchema.index({ lastMovementDate: 1, totalStock: 1 });

module.exports = mongoose.model('Product', productSchema);
