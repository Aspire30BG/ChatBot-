const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  currentOrder: [{
    item: String,
    price: Number,
    qty: { type: Number, default: 1 } // ✅ ADD THIS FIELD
  }],
  orderHistory: [{
    items: [{
      item: String,
      price: Number,
      qty: { type: Number, default: 1 } // ✅ ADD THIS FIELD TOO
    }],
    total: Number,
    date: { type: Date, default: Date.now }
  }],
  stage: { type: String, default: 'main' }
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);