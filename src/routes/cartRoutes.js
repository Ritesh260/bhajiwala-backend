
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authUserMiddleware");

const {
  addToCart,
  getCart,
  updateCartQuantity,
  removeCartItem,
  clearCart,
} = require("../controllers/cartController");

router.use(protect);

router.post("/add", addToCart);
router.get("/", getCart);
router.patch("/:itemId", updateCartQuantity);
router.delete("/clear", clearCart);
router.delete("/:itemId", removeCartItem);

module.exports = router;
