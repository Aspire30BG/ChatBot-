const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const deviceId = "test-device-123"; // Keep this constant for preserving history

// Append message to chat window
function appendMessage(sender, msg) {
  const p = document.createElement("p");
  p.textContent = `${sender}: ${msg}`;
  chatBox.appendChild(p);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ✅ Show bot greeting on page load
document.addEventListener("DOMContentLoaded", async () => {
  appendMessage("Bot", "👋 Welcome to Restaurant ChatBot!");
  appendMessage(
    "Bot",
    "Type:\n1 - Place an order\n99 - Checkout order\n98 - Order history\n97 - Current order\n0 - Cancel order"
  );

  // 🚀 Reset session on page load
  await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId, message: "start" })
  });
});

// ✅ Handle send button click
sendBtn.addEventListener("click", async () => {
  const msg = input.value.trim();
  if (!msg) return;

  // Show user message
  appendMessage("You", msg);

  try {
    // Send to backend
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, message: msg })
    });

    const data = await res.json();

    // Show bot reply
    appendMessage("Bot", data.reply);

    // 🚀 If backend sends a redirect, show a button
    if (data.redirect) {
      const btn = document.createElement("button");
      btn.textContent = "Proceed to Payment 💳";
      btn.onclick = () => {
        window.location.href = data.redirect;
      };
      chatBox.appendChild(btn);
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  } catch (err) {
    appendMessage("Bot", "⚠️ Error connecting to server.");
  }

  input.value = "";
});

// ✅ Optional: allow Enter key to send
input.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    sendBtn.click();
  }
});
