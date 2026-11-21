
const jwt = require("jsonwebtoken");
const DeliveryPartner = require("../models/DeliveryPartner");

// Verify login token
const verifyDeliveryPartner = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Please login first",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (decoded.role !== "deliveryPartner") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const partner = await DeliveryPartner.findById(decoded.id);

    if (!partner) {
      return res.status(401).json({
        success: false,
        message: "Delivery partner not found",
      });
    }

    if (!partner.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    req.deliveryPartner = partner;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// Only approved partners can access dashboard
const requireApprovedPartner = (req, res, next) => {
  if (req.deliveryPartner.applicationStatus !== "approved") {
    return res.status(403).json({
      success: false,
      applicationStatus: req.deliveryPartner.applicationStatus,
      message:
        req.deliveryPartner.applicationStatus === "pending"
          ? "Your application is pending approval"
          : "Your application has been rejected",
    });
  }

  next();
};

module.exports = {
  verifyDeliveryPartner,
  requireApprovedPartner,
};
