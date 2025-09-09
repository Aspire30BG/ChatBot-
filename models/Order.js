const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: String,
  items: [{ item: String, price: Number }],
  total: Number,
  status: { type: String, default: "pending" },
  scheduledFor: Date
});

module.exports = mongoose.model("Order", orderSchema);
