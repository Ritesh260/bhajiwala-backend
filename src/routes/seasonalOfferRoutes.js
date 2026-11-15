
const express = require("express");
const multer = require("multer");

const router = express.Router();

const {
  createSeasonalOffer,
  getSeasonalOffers,
  getSeasonalOfferById,
  updateSeasonalOffer,
  deleteSeasonalOffer,
} = require("../controllers/seasonalOfferController");

// ==========================================
// MULTER CONFIGURATION
// ==========================================

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// ==========================================
// ROUTES
// ==========================================

router.post("/", upload.single("image"), createSeasonalOffer);

router.get("/", getSeasonalOffers);

router.get("/:id", getSeasonalOfferById);

router.put("/:id", upload.single("image"), updateSeasonalOffer);

router.delete("/:id", deleteSeasonalOffer);

module.exports = router;
