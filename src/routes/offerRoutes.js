
const express = require("express");
const router = express.Router();

const {
  createOffer,
  getOffers,
  getOfferById,
  updateOffer,
  deleteOffer,
} = require("../controllers/offerController");

// Add Offer
router.post("/today", createOffer);

// Get All Offers
router.get("/today", getOffers);

// Get Single Offer
router.get("/today/:id", getOfferById);

// Update Offer
router.put("/today/:id", updateOffer);

// Delete Offer
router.delete("/today/:id", deleteOffer);

module.exports = router;
