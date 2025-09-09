Here’s a ready-to-use `README.md` for your **Restaurant ChatBot (Express + MongoDB + Paystack)** project:

```markdown
# 🍽️ Restaurant ChatBot

A simple chatbot application built with **Express.js**, **MongoDB**, and **EJS** that allows users to:
- Place and manage food orders
- Checkout orders and pay securely with **Paystack**
- View current orders and order history

---

## Features
- Interactive chatbot interface (EJS + vanilla JS)
- Session-based order management (MongoDB)
- Place, cancel, and track orders
- Secure payment integration with Paystack
- Order history preserved per device/session

---

## Project Structure
```

├── config/
│   ├── db.js                # MongoDB connection
│   └── paystack.js          # Paystack axios instance
├── controllers/
│   ├── chatbotController.js # Chat handling logic
│   └── paymentController.js # Payment flow (initiate + verify)
├── models/
│   └── Session.js           # Session schema
├── public/
│   ├── css/style.css        # Frontend styles
│   └── js/chat.js           # Chat UI logic
├── routes/
│   ├── chatbotRoutes.js     # Chatbot endpoints
│   └── paymentRoutes.js     # Payment endpoints
├── views/
│   └── index.ejs            # Chat UI page
├── .env                     # Environment variables
├── index.js                 # Main Express app
└── README.md                # Project documentation

````

---

## ⚙️ Installation & Setup

### 1. Clone repo
```bash
git clone https://github.com/yourusername/restaurant-chatbot.git
cd restaurant-chatbot
````

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root with:

```env
PORT=4000
MONGO_URI=your_mongodb_connection_string
PAYSTACK_SECRET=your_paystack_secret_key
BASE_URL=http://localhost:4000
```

### 4. Start server

```bash
npm run dev
```

App will be running at:
👉 [http://localhost:4000](http://localhost:4000)

---

## 💬 Usage Flow

1. Open `http://localhost:4000`

2. Bot greets you with menu options:

   ```
   👋 Welcome to Restaurant ChatBot!
   Type:
   1 - Place an order
   99 - Checkout order
   98 - Order history
   97 - Current order
   0 - Cancel order
   ```

3. Type:

   * `1` → See menu & pick items (`1`, `2`, `3`, etc.)
   * `99` → Checkout and pay with Paystack
   * `97` → View current order
   * `98` → View past orders
   * `0` → Cancel order

4. On checkout, a **Pay Now** button will appear and redirect you to Paystack.

---

## 💳 Payment Flow

1. User selects `99` (checkout).
2. Bot calculates total and returns a **Pay Now** button.
3. Clicking the button redirects to Paystack.
4. On successful payment, order is added to history and current order is cleared.

---

## 🛠️ Tech Stack

* **Backend**: Node.js, Express.js
* **Database**: MongoDB + Mongoose
* **Frontend**: EJS, vanilla JS, CSS
* **Payments**: Paystack API
* **Other**: dotenv, axios, nodemon

---

## 📜 License

MIT License © 2025

```

---

