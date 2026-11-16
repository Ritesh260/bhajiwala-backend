
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authUserMiddleware");

const {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  clearWishlist,
} = require("../controllers/wishlistController");

router.use(protect);

router.post("/add", addToWishlist);
router.get("/", getWishlist);
router.delete("/clear", clearWishlist);
router.delete("/:productId", removeFromWishlist);

module.exports = router;
