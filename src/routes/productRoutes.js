const express = require("express");

const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// Get all products
router.get("/", getProducts);

// Get single product
router.get("/:id", getProduct);

// Create product
router.post(
  "/",
  upload.fields([
    {
      name: "images",
      maxCount: 10,
    },
  ]),
  createProduct
);

// Update product
router.put(
  "/:id",
  upload.fields([
    {
      name: "images",
      maxCount: 10,
    },
  ]),
  updateProduct
);

// Delete product
router.delete("/:id", deleteProduct);

module.exports = router;