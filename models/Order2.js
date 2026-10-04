const mongoose = require("mongoose");

const STATUSES = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    customer: {
      name: { type: String, required: true },
      mobile: { type: String, required: true },
      email: { type: String, required: true }
    },
    address: {
      house: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      landmark: { type: String, default: "" }
    },
    items: [
      {
        productId: Number,
        name: String,
        price: Number,
        qty: Number
      }
    ],
    subtotal: { type: Number, required: true },
    deliveryCharge: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["Cash on Delivery"], default: "Cash on Delivery" },
    status: { type: String, enum: STATUSES, default: "Pending", index: true }
  },
  { timestamps: true } // adds createdAt (order date/time) and updatedAt
);

module.exports = mongoose.model("Order", orderSchema);
module.exports.STATUSES = STATUSES;
