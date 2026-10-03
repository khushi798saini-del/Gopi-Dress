const jwt = require("jsonwebtoken");

module.exports = function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);

    if (data.role !== "admin") {
      throw new Error("not admin");
    }

    next();
  } catch (e) {
    res.status(401).json({ error: "Please login again." });
  }
};