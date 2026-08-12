const express = require("express");

const {
  createProduct,
  getProducts,
  getProduct,
  getProductBySlug,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const upload = require("../middleware/uploadMiddleware");

const router = express.Router();


// ==========================================
// GET ALL PRODUCTS
// ==========================================
router.get("/", getProducts);


// ==========================================
// GET PRODUCT BY SLUG
// IMPORTANT: Keep this BEFORE /:id
// ==========================================
router.get("/slug/:slug", getProductBySlug);


// ==========================================
// GET PRODUCT BY ID
// ==========================================
router.get("/:id", getProduct);


// ==========================================
// CREATE PRODUCT
// ==========================================
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


// ==========================================
// UPDATE PRODUCT
// ==========================================
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


// ==========================================
// DELETE PRODUCT
// ==========================================
router.delete("/:id", deleteProduct);


module.exports = router;