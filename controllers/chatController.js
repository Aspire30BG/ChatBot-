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

  // Normalize message input
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
      stage: "main",
    });
  } else {
    // Ensure stage exists
    if (!session.stage) {
      session.stage = "main";
    }
    
    // Clear current order on new chat start
    if (message.toLowerCase() === "start") {
      session.currentOrder = [];
      session.stage = "main";
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
            "🍽️ Select an item number (you can include quantity in the format '5x4' meaning 5 of item #4):\n" +
            ITEMS.map((i) => `${i.id}. ${i.name} - ₦${i.price}`).join("\n"),
        });

      case "99":
        if (session.currentOrder.length === 0) {
          return res.json({
            reply: "⚠️ You have no items in your cart. Type 1 to view the menu and start ordering.",
          });
        }

        // Calculate total with quantity
        const total = session.currentOrder.reduce(
          (sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 1),
          0
        );

        await session.save();

        return res.json({
          reply: `✅ Order placed!\n💵 Total = ₦${total}\nProceeding to payment...`,
          redirect: `/api/pay/initiate?deviceId=${deviceId}`,
        });

      case "98": {
        if (!session.orderHistory || session.orderHistory.length === 0) {
          return res.json({ reply: "📭 You haven't placed any orders yet." });
        }

        let historyReply = "📜 Order History:\n";
        session.orderHistory.forEach((order, index) => {
          historyReply += `\nOrder ${index + 1}\n`;

          // Legacy array-format (without total field)
          if (Array.isArray(order)) {
            let totalOrder = 0;
            order.forEach((item) => {
              const qty = Number(item.qty) || 1;
              const price = Number(item.price) || 0;
              const itemTotal = price * qty;
              historyReply += `   • ${qty}x ${item.item} - ₦${itemTotal}\n`;
              totalOrder += itemTotal;
            });
            historyReply += `   👉 Total: ₦${totalOrder}\n`;
          }
          // New object-format { items, total, date }
          else if (order.items) {
            let totalOrder = 0;
            order.items.forEach((item) => {
              const qty = Number(item.qty) || 1;
              const price = Number(item.price) || 0;
              const itemTotal = price * qty;
              historyReply += `   • ${qty}x ${item.item} - ₦${itemTotal}\n`;
              totalOrder += itemTotal;
            });
            // Use stored total if available, otherwise calculate
            const displayTotal = order.total !== undefined ? order.total : totalOrder;
            historyReply += `   👉 Total: ₦${displayTotal}\n`;
          }
        });

        return res.json({ reply: historyReply });
      }

      case "97":
        if (session.currentOrder.length === 0) {
          return res.json({ reply: "🛒 Your cart is empty. Type 1 to add items." });
        }
        
        // Show quantity in cart view
        const orderLines = session.currentOrder.map((item) => {
          const qty = Number(item.qty) || 1;
          const price = Number(item.price) || 0;
          return `${qty}x ${item.item} (₦${price * qty})`;
        });

        const total97 = session.currentOrder.reduce(
          (sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 1),
          0
        );

        return res.json({
          reply: `🛒 Current order:\n${orderLines.join("\n")}\n👉 Total: ₦${total97}`,
        });

      case "0":
        session.currentOrder = [];
        session.stage = "main";
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

  // ORDERING STAGE
  if (session.stage === "ordering") {
    // Handle quantity format (e.g., "2x3" or just "3")
    const parts = message.toLowerCase().split("x");
    let qty = 1;
    let itemId = message;

    if (parts.length === 2) {
      // Format: "2x3" - quantity specified
      qty = parseInt(parts[0], 10) || 1;
      itemId = parts[1];
    }

    // Validate numeric input
    if (!/^\d+$/.test(itemId)) {
      return res.json({
        reply: "⚠️ Please enter a valid number or quantity+number (e.g., 2x3).",
      });
    }

    const item = ITEMS.find((i) => i.id == itemId);
    if (item) {
      // Add item with quantity
      session.currentOrder.push({
        item: item.name,
        price: item.price,
        qty: qty,
      });
      
      session.stage = "main"; // back to main menu
      await session.save();
      
      return res.json({
        reply: `${qty}x ${item.name} added 🛒. Type 1 to add more items or 99 to checkout.`,
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