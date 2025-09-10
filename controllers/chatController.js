const Session = require("../models/Session");

const ITEMS = [
  { id: 1, name: "Jollof Rice", price: 3000 },
  { id: 2, name: "Pizza", price: 3500 },
  { id: 3, name: "Burger", price: 2000 },
  { id: 4, name: "Chicken and Chips", price: 5500 },
  { id: 5, name: "Suya Burger", price: 4000 },
  { id: 6, name: "Shawarma", price: 4500 },
  { id: 7, name: "Asun Shawarma", price: 6000 },
];

exports.handleChat = async (req, res) => {
  let { deviceId, message } = req.body;

  // ✅ Normalize message input
  if (typeof message === "string") {
    message = message.trim();
  } else {
    return res.json({ reply: "⚠️ Invalid input. Please type a valid option number." });
  }

  let session = await Session.findOne({ deviceId });
  if (!session) {
    session = await Session.create({
      deviceId,
      currentOrder: [],
      orderHistory: [],
    });
  } else {
    // Clear current order on new chat start
    if (message.toLowerCase() === "start") {
      session.currentOrder = [];
      await session.save();
      return res.json({
        reply: "🔄 New session started! Type 1 to place an order, or 99 to checkout.",
      });
    }
  }

  // MAIN STAGE
  if (session.stage === "main") {
    switch (message) {
      case "1":
        // show menu & move to ordering
        session.stage = "ordering";
        await session.save();
        return res.json({
          reply:
            "🍽️ Select an item number:\n" +
            ITEMS.map((i) => `${i.id}. ${i.name} - ₦${i.price}`).join("\n"),
        });

      case "99":
        if (session.currentOrder.length === 0) {
          return res.json({
            reply: "⚠️ You have no items in your cart. Type 1 to view the menu and start ordering.",
          });
        }

        // Calculate total without clearing
        const total = session.currentOrder.reduce((sum, i) => sum + i.price, 0);

        await session.save();

        return res.json({
          reply: `✅ Order placed!\n💵 Total = ₦${total}\nProceeding to payment...`,
          redirect: `/api/pay/initiate?deviceId=${deviceId}`,
        });

      case "98":
        if (!session.orderHistory || session.orderHistory.length === 0) {
          return res.json({ reply: "📭 You haven't placed any orders yet." });
        }

        let historyReply = "📜 Order History:\n";
        session.orderHistory.forEach((order, index) => {
          historyReply += `\nOrder ${index + 1}\n`;

          // ✅ Handle both formats: array OR { items, total }
          if (Array.isArray(order)) {
            order.forEach((item) => {
              historyReply += `   • ${item.item} - ₦${item.price}\n`;
            });
            const total = order.reduce((sum, i) => sum + i.price, 0);
            historyReply += `   👉 Total: ₦${total}\n`;
          } else if (order.items) {
            order.items.forEach((item) => {
              historyReply += `   • ${item.item} - ₦${item.price}\n`;
            });
            historyReply += `   👉 Total: ₦${order.total}\n`;
          }
        });

        return res.json({ reply: historyReply });

      case "97":
        if (session.currentOrder.length === 0) {
          return res.json({ reply: "🛒 Your cart is empty. Type 1 to add items." });
        }
        return res.json({
          reply:
            "🛒 Current order:\n" +
            session.currentOrder.map((i) => `${i.item} (₦${i.price})`).join(", "),
        });

      case "0":
        session.currentOrder = [];
        await session.save();
        return res.json({ reply: "❌ Your current order has been cancelled." });

      default:
        return res.json({
          reply:
            "⚠️ Invalid option. Please choose one of the following:\n" +
            "1 - Place an order\n99 - Checkout order\n98 - Order history\n97 - Current order\n0 - Cancel order",
        });
    }
  }

  // 🔹 ORDERING STAGE
  if (session.stage === "ordering") {
    // ✅ Ensure numeric input
    if (!/^\d+$/.test(message)) {
      return res.json({
        reply: "⚠️ Please enter a valid number for your selection (e.g., 1, 2, 3).",
      });
    }

    const item = ITEMS.find((i) => i.id == message);
    if (item) {
      session.currentOrder.push({ item: item.name, price: item.price });
      session.stage = "main"; // back to main menu
      await session.save();
      return res.json({
        reply: `${item.name} added 🛒. Type 1 to add more items or 99 to checkout.`,
      });
    } else {
      return res.json({
        reply:
          "⚠️ That item number doesn't exist. Please select from the menu:\n" +
          ITEMS.map((i) => `${i.id}. ${i.name} - ₦${i.price}`).join("\n"),
      });
    }
  }
};

