
const express = require("express");
const router = express.Router();

const {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
} = require("../controllers/couponController");

// POST - Create coupon
router.post("/", createCoupon);

// GET - All coupons
router.get("/", getAllCoupons);

// GET - Single coupon
router.get("/:id", getCouponById);

// PUT - Update coupon
router.put("/:id", updateCoupon);

// DELETE - Delete coupon
router.delete("/:id", deleteCoupon);

module.exports = router;
