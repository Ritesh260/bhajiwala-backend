const mongoose = require("mongoose");
const Offer = require("../models/Offer");
const Product = require("../models/Products");

// ==========================================
// ADD TODAY'S OFFER
// ==========================================
const createOffer = async (req, res) => {
  try {
    const {
      productId,
      oldPrice,
      offerPrice,
      startDate,
      endDate,
      startTime,
      endTime,
      status,
      featured,
    } = req.body;

    if (
      !productId ||
      oldPrice === undefined ||
      offerPrice === undefined ||
      !startDate ||
      !endDate ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
      });
    }

    if (!Product) {
      return res.status(500).json({
        success: false,
        message: "Product model not found.",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    if (
      !mongoose.isValidObjectId(productId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const originalPrice = Number(oldPrice);
    const discountedPrice = Number(offerPrice);

    if (
      !Number.isFinite(originalPrice) ||
      !Number.isFinite(discountedPrice) ||
      originalPrice <= 0 ||
      discountedPrice < 0 ||
      discountedPrice >= originalPrice
    ) {
      return res.status(400).json({
        success: false,
        message: "Offer price must be lower than original price.",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end < start
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid offer dates.",
      });
    }

    const discount = Math.round(
      ((originalPrice - discountedPrice) / originalPrice) * 100
    );

    const offer = await Offer.create({
      productId,
      oldPrice: originalPrice,
      offerPrice: discountedPrice,
      discount,
      startDate: start,
      endDate: end,
      startTime,
      endTime,
      status: status || "Active",
      featured: featured === true || featured === "true",
    });

    const populatedOffer = await Offer.findById(offer._id)
      .populate("productId");

    return res.status(201).json({
      success: true,
      message: "Today's offer created successfully.",
      data: populatedOffer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================================
// GET ALL TODAY'S OFFERS
// ==========================================
const getOffers = async (req, res) => {
  try {
    const { search, status } = req.query;

    let filter = {};

    if (status && status !== "All") {
      filter.status = status;
    }

    let offers = await Offer.find(filter)
      .populate("productId")
      .sort({ createdAt: -1 });

    if (search) {
      offers = offers.filter((offer) =>
        offer.productId?.name
          ?.toLowerCase()
          .includes(search.toLowerCase())
      );
    }

    const now = new Date();

    const formattedOffers = offers.map((offer) => {
      const offerObject = offer.toObject();

      if (offer.status === "Inactive") {
        offerObject.displayStatus = "Inactive";
      } else if (offer.endDate < now) {
        offerObject.displayStatus = "Expired";
      } else {
        offerObject.displayStatus = "Active";
      }

      return offerObject;
    });

    return res.status(200).json({
      success: true,
      total: formattedOffers.length,
      data: formattedOffers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================================
// GET SINGLE OFFER
// ==========================================
const getOfferById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid offer ID.",
      });
    }

    const offer = await Offer.findById(id).populate("productId");

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: offer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================================
// UPDATE OFFER
// ==========================================
const updateOffer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid offer ID.",
      });
    }

    const existingOffer = await Offer.findById(id);

    if (!existingOffer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found.",
      });
    }

    const updates = { ...req.body };

    if (updates.productId) {
      if (!mongoose.isValidObjectId(updates.productId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID.",
        });
      }

      const product = await Product.findById(updates.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found.",
        });
      }
    }

    const oldPrice = Number(
      updates.oldPrice ?? existingOffer.oldPrice
    );

    const offerPrice = Number(
      updates.offerPrice ?? existingOffer.offerPrice
    );

    if (
      !Number.isFinite(oldPrice) ||
      !Number.isFinite(offerPrice) ||
      oldPrice <= 0 ||
      offerPrice < 0 ||
      offerPrice >= oldPrice
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid offer pricing.",
      });
    }

    const startDate = new Date(
      updates.startDate ?? existingOffer.startDate
    );

    const endDate = new Date(
      updates.endDate ?? existingOffer.endDate
    );

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      endDate < startDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid offer dates.",
      });
    }

    updates.oldPrice = oldPrice;
    updates.offerPrice = offerPrice;
    updates.discount = Math.round(
      ((oldPrice - offerPrice) / oldPrice) * 100
    );

    const updatedOffer = await Offer.findByIdAndUpdate(
      id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    ).populate("productId");

    return res.status(200).json({
      success: true,
      message: "Offer updated successfully.",
      data: updatedOffer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================================
// DELETE OFFER
// ==========================================
const deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid offer ID.",
      });
    }

    const offer = await Offer.findByIdAndDelete(id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Offer deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


module.exports = {
  createOffer,
  getOffers,
  getOfferById,
  updateOffer,
  deleteOffer,
};
