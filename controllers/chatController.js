const Session = require("../models/Session");

const ITEMS = [
  { id: 1, name: "Jollof Rice", price: 1000 },
  { id: 2, name: "Pizza", price: 3500 },
  { id: 3, name: "Burger", price: 2000 },
];

exports.handleChat = async (req, res) => {
  const { deviceId, message } = req.body;

  let session = await Session.findOne({ deviceId });
  if (!session) {
    session = await Session.create({
      deviceId,
      currentOrder: [],
      orderHistory: [],
      stage: "main",
    });
  }

  // 🔹 MAIN STAGE
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
          return res.json({ reply: "⚠️ No order to place" });
        }

        // Calculate total without clearing
        const total = session.currentOrder.reduce((sum, i) => sum + i.price, 0);

        await session.save();

        return res.json({
          reply: `✅ Order placed!\n💵 Total = ₦${total}\nRedirecting to payment...`,
          redirect: `/api/pay/initiate?deviceId=${deviceId}`,
        });

      case "97":
        if (session.currentOrder.length === 0) {
          return res.json({ reply: "🛒 No items in current order." });
        }
        return res.json({
          reply:
            "🛒 Current order:\n" +
            session.currentOrder
              .map((i) => `${i.item} (₦${i.price})`)
              .join(", "),
        });

      case "0":
        session.currentOrder = [];
        await session.save();
        return res.json({ reply: "❌ Order cancelled" });

      default:
        return res.json({
          reply: "⚠️ Invalid option. Type 1, 99, 98, 97, or 0.",
        });
    }
  }

  // 🔹 ORDERING STAGE
  if (session.stage === "ordering") {
    const item = ITEMS.find((i) => i.id == message);
    if (item) {
      session.currentOrder.push({ item: item.name, price: item.price });
      session.stage = "main"; // back to main menu
      await session.save();
      return res.json({
        reply: `${item.name} added 🛒. Type 1 to add more or 99 to checkout.`,
      });
    } else {
      return res.json({
        reply:
          "⚠️ Invalid choice. Please type the number of the item (e.g. 1, 2, 3).",
      });
    }
  }
};
