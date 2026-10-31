const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const adminAuthMiddleware = async (req, res, next) => {
  try {
    // First check HttpOnly admin cookie
    const cookieToken = req.cookies?.hvacAdminToken;

    // Bearer token fallback for compatibility
    const authHeader = req.headers.authorization;

    const bearerToken =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;

    const token = cookieToken || bearerToken;

    if (!token) {
      return res.status(401).json({
        message: "Admin authentication required.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.adminId);

    if (!admin) {
      return res.status(401).json({
        message: "Admin account not found.",
      });
    }

    if ((decoded.tokenVersion ?? 0) !== (admin.tokenVersion ?? 0)) {
      return res.status(401).json({
        message: "Admin session expired. Please login again.",
      });
    }
    if (decoded.role !== "admin") {
      return res.status(403).json({
        message: "Admin access required.",
      });
    }

    req.admin = {
      ...decoded,
      adminId: admin._id,
    };
    next();
  } catch (error) {
    console.error("Admin Auth Error:", error);

    return res.status(401).json({
      message: "Invalid or expired admin token.",
    });
  }
};

module.exports = adminAuthMiddleware;
