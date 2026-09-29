const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware =async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

if (!user) {
  return res.status(401).json({
    message: "User not found.",
  });
}

if (!user.activeSessionId || user.activeSessionId !== decoded.sessionId) {
  return res.status(401).json({
    message: "This account is active on another device. Please login again.",
  });
}

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;
