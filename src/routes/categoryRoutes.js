const express = require("express");

const {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const upload = require("../middleware/uploadMiddleware");

const router = express.Router();


// ==========================================
// CREATE CATEGORY
// ==========================================

router.post(
  "/",
  upload.fields([
    {
      name: "image",
      maxCount: 1,
    },
    {
      name: "banner",
      maxCount: 1,
    },
  ]),
  createCategory
);


// ==========================================
// GET ALL CATEGORIES
// ==========================================

router.get(
  "/",
  getCategories
);


// ==========================================
// GET SINGLE CATEGORY
// ==========================================

router.get(
  "/:id",
  getCategory
);


// ==========================================
// UPDATE CATEGORY
// ==========================================

router.put(
  "/:id",
  upload.fields([
    {
      name: "image",
      maxCount: 1,
    },
    {
      name: "banner",
      maxCount: 1,
    },
  ]),
  updateCategory
);


// ==========================================
// DELETE CATEGORY
// ==========================================

router.delete(
  "/:id",
  deleteCategory
);


module.exports = router;