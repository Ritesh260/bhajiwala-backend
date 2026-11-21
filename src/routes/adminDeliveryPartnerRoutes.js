
const express = require("express");
const protect = require("../middleware/authMiddleware");

const {
  getAllDeliveryPartners,
  getDeliveryPartnerById,
  approveDeliveryPartner,
  rejectDeliveryPartner,
} = require("../controllers/adminDeliveryPartnerController");

const router = express.Router();

// All routes require admin authentication
router.use(protect);

// Get all delivery partners
router.get("/", getAllDeliveryPartners);

// Get single delivery partner details
router.get("/:id", getDeliveryPartnerById);

// Approve partner
router.patch("/:id/approve", approveDeliveryPartner);

// Reject partner
router.patch("/:id/reject", rejectDeliveryPartner);

module.exports = router;
