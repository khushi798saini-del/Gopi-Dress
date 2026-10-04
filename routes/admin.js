const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Order = require("../models/Order2");
const requireAdmin = require("../middleware/auth");
const { STATUSES } = require("../models/Order2");

// ===============================
// ADMIN LOGIN
// ===============================
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (
      username !== process.env.ADMIN_USERNAME ||
      !password
    ) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const valid = await bcrypt.compare(
      password,
      process.env.ADMIN_PASSWORD_HASH
    );

    if (!valid) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const token = jwt.sign(
      {
        username: process.env.ADMIN_USERNAME,
        role: "admin"
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (err) {
    console.error("Admin login error:", err.message);
    res.status(500).json({ error: "Login failed." });
  }
});

// ===============================
// GET ORDERS
// ===============================
router.get("/orders", requireAdmin, async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = 10;
    const skip = (page - 1) * limit;

    const status = req.query.status || "All";
    const q = String(req.query.q || "").trim();

    const filter = {};

    if (status !== "All" && STATUSES.includes(status)) {
      filter.status = status;
    }

    if (q) {
      filter.$or = [
        { orderId: { $regex: q, $options: "i" } },
        { "customer.name": { $regex: q, $options: "i" } },
        { "customer.mobile": { $regex: q, $options: "i" } },
        { "customer.email": { $regex: q, $options: "i" } }
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Order.countDocuments(filter)
    ]);

    const countsArray = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const counts = {
      Pending: 0,
      Confirmed: 0,
      Shipped: 0,
      Delivered: 0,
      Cancelled: 0
    };

    countsArray.forEach(x => {
      if (counts[x._id] !== undefined) {
        counts[x._id] = x.count;
      }
    });

    const pages = Math.max(Math.ceil(total / limit), 1);

    res.json({
      counts,
      total,
      orders,
      pages,
      page
    });
  } catch (err) {
    console.error("Load orders error:", err.message);
    res.status(500).json({ error: "Could not load orders." });
  }
});

// ===============================
// UPDATE ORDER STATUS
// ===============================
router.patch(
  "/orders/:orderId/status",
  requireAdmin,
  async (req, res) => {
    try {
      const orderId = req.params.orderId;
      const status = req.body?.status;

      if (!STATUSES.includes(status)) {
        return res.status(400).json({
          error: "Invalid order status."
        });
      }

      const order = await Order.findOneAndUpdate(
        { orderId },
        { $set: { status } },
        { new: true }
      ).lean();

      if (!order) {
        return res.status(404).json({
          error: "Order not found."
        });
      }

      res.json({
        message: "Order status updated.",
        order
      });
    } catch (err) {
      console.error("Update status error:", err.message);
      res.status(500).json({
        error: "Could not update order status."
      });
    }
  }
);

module.exports = router;