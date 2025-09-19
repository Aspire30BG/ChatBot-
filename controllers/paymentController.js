const paystack = require("../config/paystack");
const Session = require("../models/Session");

exports.initiatePayment = async (req, res) => {
  try {
    const { deviceId } = req.query; // identify session

    // Find session
    const session = await Session.findOne({ deviceId });
    if (!session || session.currentOrder.length === 0) {
      return res
        .status(400)
        .json({ error: "No order found for this session." });
    }

    //Calculate total order amount WITH quantity
    const totalAmount = session.currentOrder.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 1),
      0
    );

    // Initialize Paystack transaction
    const response = await paystack.post("/transaction/initialize", {
      email: "customer@email.com", // TODO: replace with actual user email input
      amount: totalAmount * 100, // Paystack expects kobo
      callback_url: `${process.env.BASE_URL}/api/pay/verify?deviceId=${deviceId}`,
    });

    // Redirect to Paystack checkout
    return res.redirect(response.data.data.authorization_url);
  } catch (err) {
    console.error("Payment Init Error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Payment initiation failed." });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { reference, deviceId } = req.query;

    // Verify transaction with Paystack
    const response = await paystack.get(`/transaction/verify/${reference}`);

    if (response.data.data.status === "success") {
      // Find session and move currentOrder into orderHistory
      const session = await Session.findOne({ deviceId });
      let receiptMessage = "✅ Payment successful!\n\n🧾 Your order:\n";

      if (session && session.currentOrder.length > 0) {
        let total = 0;
        
        session.currentOrder.forEach((item) => {
          const qty = Number(item.qty) || 1;
          const price = Number(item.price) || 0;
          const itemTotal = price * qty;
          
          receiptMessage += `• ${qty}x ${item.item} - ₦${itemTotal}\n`;
          total += itemTotal;
        });

        receiptMessage += `👉 Total: ₦${total}`;

        // Move items into orderHistory
        session.orderHistory.push({
          items: [...session.currentOrder],
          total: total, //Store the correct total
          date: new Date(),
        });

        // Clear current order
        session.currentOrder = [];
        await session.save();
      }

      // Redirect back to chatbot with receipt
      return res.redirect(`/?status=success&message=${encodeURIComponent(receiptMessage)}`);
    } else {
      return res.redirect(`/?status=failed`);
    }
  } catch (err) {
    console.error("Payment Verify Error:", err.response?.data || err.message);
    return res.redirect(`/?status=failed`);
  }
};