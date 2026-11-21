
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authUserMiddleware");

const {
  getCheckoutSummary,
} = require("../controllers/checkoutController");

router.use(protect);

router.post("/summary", getCheckoutSummary);

module.exports = router;
