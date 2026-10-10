require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/config", (_req, res) => {
  res.json({
    paymentsConfigured: Boolean(PAYSTACK_SECRET_KEY && PAYSTACK_SECRET_KEY.startsWith("sk_")),
    whatsappConfigured: Boolean(process.env.WHATSAPP_NUMBER && process.env.WHATSAPP_NUMBER !== "2348012345678")
  });
});

// Prices are re-calculated on the server from this catalogue; never trust browser totals.
const catalogue = {
  jollof: { name: "Jollof Rice & Grilled Chicken", price: 450000 },
  suya: { name: "Beef Suya Platter", price: 550000 },
  burger: { name: "TMAX Signature Burger", price: 480000 },
  pasta: { name: "Creamy Chicken Pasta", price: 520000 },
  fries: { name: "Crispy Potato Fries", price: 180000 },
  salad: { name: "Fresh Garden Salad", price: 220000 },
  juice: { name: "Fresh Fruit Juice", price: 150000 },
  zobo: { name: "Chilled Zobo", price: 100000 },
  cake: { name: "Chocolate Cake", price: 250000 }
};

app.post("/api/payments/initialize", async (req, res) => {
  try {
    if (!PAYSTACK_SECRET_KEY || !PAYSTACK_SECRET_KEY.startsWith("sk_")) {
      return res.status(503).json({ error: "Online payments are not configured yet. Add a Paystack test secret key to the server environment first." });
    }
    const { email, customerName, phone, orderType, address, notes, items } = req.body || {};
    if (!email || !customerName || !phone || !Array.isArray(items) || items.length < 1) {
      return res.status(400).json({ error: "Please provide your name, email, phone number, and at least one cart item." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Please enter a valid email address for your payment receipt." });
    let total = 0;
    const orderItems = [];
    for (const item of items) {
      const product = catalogue[item.id];
      const qty = Number(item.quantity);
      if (!product || !Number.isInteger(qty) || qty < 1 || qty > 30) {
        return res.status(400).json({ error: "An item in your cart is invalid. Please refresh and try again." });
      }
      total += product.price * qty;
      orderItems.push({ id: item.id, name: product.name, quantity: qty, unitPriceKobo: product.price, lineTotalKobo: product.price * qty });
    }
    if (total <= 0 || total > 100000000) return res.status(400).json({ error: "This order total is outside the permitted range." });

    const reference = `TMAX-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const order = { reference, customerName: String(customerName).slice(0,100), email: String(email).slice(0,150), phone: String(phone).slice(0,40), orderType: String(orderType || "Pickup").slice(0,40), address: String(address || "").slice(0,400), notes: String(notes || "").slice(0,800), items: orderItems, totalKobo: total, createdAt: new Date().toISOString() };

    // Demo starter: the order is returned to the caller. For production, persist orders in a database.
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email: order.email, amount: total, reference, callback_url: `${BASE_URL}/payment-result.html`, metadata: { order } })
    });
    const data = await response.json();
    if (!response.ok || !data.status || !data.data?.authorization_url) {
      console.error("Paystack initialize error:", data.message || response.status);
      return res.status(502).json({ error: "We could not start checkout. Please try again shortly." });
    }
    res.json({ authorizationUrl: data.data.authorization_url, reference });
  } catch (error) {
    console.error("Payment initialization error:", error.message);
    res.status(500).json({ error: "Something went wrong while preparing checkout." });
  }
});

app.get("/api/payments/verify", async (req, res) => {
  try {
    const reference = String(req.query.reference || "");
    if (!reference || !/^TMAX-[A-Za-z0-9-]+$/.test(reference)) return res.status(400).json({ error: "Missing or invalid payment reference." });
    if (!PAYSTACK_SECRET_KEY || !PAYSTACK_SECRET_KEY.startsWith("sk_")) return res.status(503).json({ error: "Payments are not configured on the server." });
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
    });
    const data = await response.json();
    if (!response.ok || !data.status) return res.status(502).json({ error: "We could not verify this payment yet." });
    res.json({
      verified: data.data.status === "success",
      status: data.data.status,
      amount: data.data.amount,
      currency: data.data.currency,
      reference: data.data.reference
    });
  } catch (error) {
    console.error("Payment verification error:", error.message);
    res.status(500).json({ error: "Payment verification failed. Please contact the restaurant before retrying." });
  }
});

app.get("/payment-result.html", (_req, res) => res.sendFile(path.join(__dirname, "public", "payment-result.html")));

app.listen(PORT, () => console.log(`TMAX Restaurant is running on port ${PORT}`));
