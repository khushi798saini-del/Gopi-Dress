const router = require("express").Router();
const Order = require("../models/Order2");
const { PRODUCTS, DELIVERY_CHARGE } = require("../products");

router.post("/", async (req, res) => {
  try {
    const {
      customer,
      address,
      items,
      paymentMethod
    } = req.body || {};

    // Basic customer validation
    if (
      !customer?.name ||
      !customer?.mobile ||
      !customer?.email
    ) {
      return res.status(400).json({
        error: "Please enter all customer details."
      });
    }

    // Basic address validation
    if (
      !address?.house ||
      !address?.street ||
      !address?.city ||
      !address?.state ||
      !address?.pincode
    ) {
      return res.status(400).json({
        error: "Please enter complete address."
      });
    }

    // Cart validation
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "Your cart is empty."
      });
    }

    // Check every cart item
    const cleanItems = [];

    for (const item of items) {
      const productId = Number(item.productId);
      const qty = Number(item.qty);

      const product = PRODUCTS.find(p => p.id === productId);

      if (!product) {
        return res.status(400).json({
          error: "Invalid item in cart."
        });
      }

      if (!Number.isInteger(qty) || qty < 1) {
        return res.status(400).json({
          error: "Invalid quantity."
        });
      }

      cleanItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        qty
      });
    }

    // Calculate total from server-side prices
    const subtotal = cleanItems.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    );

    const total = subtotal + DELIVERY_CHARGE;

    // Only COD allowed
    if (paymentMethod && paymentMethod !== "Cash on Delivery") {
      return res.status(400).json({
        error: "Only Cash on Delivery is available."
      });
    }

    // Generate order ID on server
    const now = new Date();

    const orderId =
      "GD" +
      now.getFullYear().toString().slice(2) +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      "-" +
      Math.random().toString(36).slice(2, 7).toUpperCase();

    const order = await Order.create({
      orderId,

      customer: {
        name: String(customer.name).trim(),
        mobile: String(customer.mobile).trim(),
        email: String(customer.email).trim()
      },

      address: {
        house: String(address.house).trim(),
        street: String(address.street).trim(),
        city: String(address.city).trim(),
        state: String(address.state).trim(),
        pincode: String(address.pincode).trim(),
        landmark: String(address.landmark || "").trim()
      },

      items: cleanItems,

      subtotal,
      deliveryCharge: DELIVERY_CHARGE,
      total,

      paymentMethod: "Cash on Delivery"
    });

    res.status(201).json({
      message: "Order placed successfully.",
      orderId: order.orderId,
      createdAt: order.createdAt,
      subtotal: order.subtotal,
      deliveryCharge: order.deliveryCharge,
      total: order.total
    });

  } catch (err) {
    console.error("Order error:", err.message);

    res.status(500).json({
      error: "Could not place order."
    });
  }
});

module.exports = router;