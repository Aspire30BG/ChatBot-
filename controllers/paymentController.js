const paystack = require("../config/paystack");
const Session = require("../models/Session");

exports.initiatePayment = async (req, res) => {
  try {
    const { deviceId } = req.query; // identify session

    // ✅ Find session
    const session = await Session.findOne({ deviceId });
    if (!session || session.currentOrder.length === 0) {
      return res
        .status(400)
        .json({ error: "No order found for this session." });
    }

    // ✅ Calculate total order amount
    const totalAmount = session.currentOrder.reduce(
      (sum, item) => sum + item.price,
      0
    );

    // ✅ Initialize Paystack transaction
    const response = await paystack.post("/transaction/initialize", {
      email: "customer@email.com", // TODO: replace with actual user email input
      amount: totalAmount * 100, // Paystack expects kobo
      callback_url: `${process.env.BASE_URL}/api/pay/verify?deviceId=${deviceId}`,
    });

    // ✅ Redirect to Paystack checkout
    return res.redirect(response.data.data.authorization_url);
  } catch (err) {
    console.error("Payment Init Error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Payment initiation failed." });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { reference, deviceId } = req.query;

    const response = await paystack.get(`/transaction/verify/${reference}`);

    if (response.data.data.status === "success") {
      const session = await Session.findOne({ deviceId });
      if (session) {
        // Move order to history after payment
        session.orderHistory.push([...session.currentOrder]);
        session.currentOrder = []; // clear cart
        await session.save();
      }
      return res.send("Payment successful! Your order has been placed.");
    } else {
      return res.send("Payment failed. Please try again.");
    }
  } catch (err) {
    console.error("Payment Verify Error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Payment verification failed." });
  }
};
