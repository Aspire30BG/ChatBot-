const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  currentOrder: [{ item: String, price: Number }],
  orderHistory: [[{ item: String, price: Number }]],
  stage: { type: String, default: "main" } // "main" | "ordering"
});

module.exports = mongoose.model("Session", sessionSchema);
