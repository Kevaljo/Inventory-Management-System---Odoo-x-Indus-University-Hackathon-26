const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String },
    type: {
      type: String,
      enum: ['shelf', 'rack', 'bin', 'floor', 'zone'],
      default: 'shelf'
    }
  },
  { _id: false }
);

const warehouseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    address: { type: String },
    country: { type: String },
    state: { type: String },
    city: { type: String },
    locations: [locationSchema],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Warehouse', warehouseSchema);
