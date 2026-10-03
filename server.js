require("dotenv").config();
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// Stop early with a clear message if .env is incomplete
const need = ["MONGODB_URI", "JWT_SECRET", "ADMIN_USERNAME", "ADMIN_PASSWORD_HASH"];
const missing = need.filter(k => !process.env[k]);
if (missing.length) {
  console.error("\n❌ Missing in .env file: " + missing.join(", ") + "\nCopy .env.example to .env and fill it.\n");
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 20) {
  console.error("\n❌ JWT_SECRET is too short. Use at least 20 random characters.\n");
  process.exit(1);
}

const app = express();
app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false })); // CSP off: site uses inline onclick + Google Fonts
app.use(express.json({ limit: "20kb" }));

const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  message: { error: "Too many orders from this device. Please try again later." }
});

app.use("/api/orders", orderLimiter, require("./routes/orders"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));

// Website + admin dashboard (files in /public)
app.use(express.static(path.join(__dirname, "public")));
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(400).json({ error: "Bad request" });
});

const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => {
      console.log("🌸 Website: http://localhost:" + PORT);
      console.log("🔐 Admin:   http://localhost:" + PORT + "/admin/");
    });
  })
  .catch(err => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });
