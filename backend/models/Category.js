const mongoose = require('mongoose');

const generateCode = (name) => {
  if (!name) return 'GEN';
  const cleaned = name.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'GEN';
  if (words.length === 1) return words[0].substring(0, 3).toUpperCase();
  return words.slice(0, 3).map(w => w[0]).join('').toUpperCase();
};

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    description: { type: String },
    parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    icon: { type: String, default: '📦' },
    color: { type: String, default: '#6B7280' },
    isActive: { type: Boolean, default: true },
    productCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Pre-save hook: auto-generate code from name
categorySchema.pre('save', function (next) {
  if (!this.code || this.isModified('name')) {
    this.code = generateCode(this.name);
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
