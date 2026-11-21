
const express = require("express");
const router = express.Router();

const protectAdmin = require("../middleware/authMiddleware");

const {
  getDeliverySettings,
  updateDeliverySettings,
} = require("../controllers/deliverySettingsController");

// Admin only
router.use(protectAdmin);

router.get("/", getDeliverySettings);
router.put("/", updateDeliverySettings);

module.exports = router;
