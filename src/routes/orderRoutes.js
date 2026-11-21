
const express = require("express");
const router = express.Router();

const protectUser = require("../middleware/authUserMiddleware");
const protectAdmin = require("../middleware/authMiddleware");

const {
  placeOrder,
  getMyOrders,
  getMyOrderById,
  cancelMyOrder,
  getAllOrders,
  getAdminOrderById,
  updateOrderStatus,
  updatePaymentStatus,
} = require("../controllers/orderController");

// ==========================================
// ADMIN ROUTES
// ==========================================

router.get("/admin/all", protectAdmin, getAllOrders);

router.get(
  "/admin/:id",
  protectAdmin,
  getAdminOrderById
);

router.patch(
  "/admin/:id/status",
  protectAdmin,
  updateOrderStatus
);

router.patch(
  "/admin/:id/payment",
  protectAdmin,
  updatePaymentStatus
);

// ==========================================
// CUSTOMER ROUTES
// ==========================================

router.use(protectUser);

router.post("/place", placeOrder);

router.get("/my", getMyOrders);

router.get("/:id", getMyOrderById);

router.post("/:id/cancel", cancelMyOrder);

module.exports = router;
