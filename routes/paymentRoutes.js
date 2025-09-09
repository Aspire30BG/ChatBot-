const express = require("express");
const router = express.Router();
const { initiatePayment, verifyPayment } = require("../controllers/paymentController");

// ✅ Allow GET since browser redirects directly
router.get("/initiate", initiatePayment);

// ✅ Verify route (Paystack callback)
router.get("/verify", verifyPayment);

module.exports = router;
