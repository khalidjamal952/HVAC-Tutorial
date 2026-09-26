const jwt = require("jsonwebtoken");

const adminAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Admin authentication required.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({
        message: "Admin access required.",
      });
    }

    req.admin = decoded;

    next();
  } catch (error) {
    console.error("Admin Auth Error:", error);

    return res.status(401).json({
      message: "Invalid or expired admin token.",
    });
  }
};

module.exports = adminAuthMiddleware;
