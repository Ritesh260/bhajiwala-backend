
const SeasonalOffer = require("../models/SeasonalOffer");
const cloudinary = require("../config/cloudinary");
const mongoose = require("mongoose");

// ==========================================
// CLOUDINARY IMAGE UPLOAD
// ==========================================

const uploadImage = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "bhajiwala/seasonal-offers",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result.secure_url);
      }
    );

    stream.end(fileBuffer);
  });
};

// ==========================================
// CREATE SEASONAL OFFER
// POST /api/offers/seasonal
// ==========================================

exports.createSeasonalOffer = async (req, res) => {
  try {
    const {
      title,
      description,
      badge,
      startDate,
      endDate,
      status,
      featured,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Offer title is required",
      });
    }

    if (
      startDate &&
      endDate &&
      new Date(endDate) < new Date(startDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date",
      });
    }

    let image = "";

    if (req.file) {
      image = await uploadImage(req.file.buffer);
    } else if (req.body.image) {
      image = req.body.image;
    }

    const offer = await SeasonalOffer.create({
      title: title.trim(),
      description: description || "",
      badge: badge || "",
      image,
      startDate: startDate || null,
      endDate: endDate || null,
      status: status || "Active",
      featured: featured === true || featured === "true",
    });

    return res.status(201).json({
      success: true,
      message: "Seasonal offer created successfully",
      offer,
    });
  } catch (error) {
    console.error("Create Seasonal Offer Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create seasonal offer",
    });
  }
};

// ==========================================
// GET ALL SEASONAL OFFERS
// GET /api/offers/seasonal
// ==========================================

exports.getSeasonalOffers = async (req, res) => {
  try {
    const offers = await SeasonalOffer.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: offers.length,
      offers,
    });
  } catch (error) {
    console.error("Get Seasonal Offers Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch seasonal offers",
    });
  }
};

// ==========================================
// GET SINGLE SEASONAL OFFER
// GET /api/offers/seasonal/:id
// ==========================================

exports.getSeasonalOfferById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid seasonal offer ID",
      });
    }

    const offer = await SeasonalOffer.findById(id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Seasonal offer not found",
      });
    }

    return res.status(200).json({
      success: true,
      offer,
    });
  } catch (error) {
    console.error("Get Seasonal Offer Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch seasonal offer",
    });
  }
};

// ==========================================
// UPDATE SEASONAL OFFER
// PUT /api/offers/seasonal/:id
// ==========================================

exports.updateSeasonalOffer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid seasonal offer ID",
      });
    }

    const offer = await SeasonalOffer.findById(id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Seasonal offer not found",
      });
    }

    const {
      title,
      description,
      badge,
      startDate,
      endDate,
      status,
      featured,
    } = req.body;

    const nextStartDate =
      startDate !== undefined
        ? startDate
        : offer.startDate;

    const nextEndDate =
      endDate !== undefined
        ? endDate
        : offer.endDate;

    if (
      nextStartDate &&
      nextEndDate &&
      new Date(nextEndDate) < new Date(nextStartDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date",
      });
    }

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Offer title cannot be empty",
        });
      }

      offer.title = title.trim();
    }

    if (description !== undefined) {
      offer.description = description;
    }

    if (badge !== undefined) {
      offer.badge = badge;
    }

    if (startDate !== undefined) {
      offer.startDate = startDate || null;
    }

    if (endDate !== undefined) {
      offer.endDate = endDate || null;
    }

    if (status !== undefined) {
      offer.status = status;
    }

    if (featured !== undefined) {
      offer.featured =
        featured === true || featured === "true";
    }

    // New image uploaded
    if (req.file) {
      offer.image = await uploadImage(req.file.buffer);
    } else if (req.body.removeImage === "true") {
      offer.image = "";
    } else if (req.body.image !== undefined) {
      offer.image = req.body.image;
    }

    await offer.save();

    return res.status(200).json({
      success: true,
      message: "Seasonal offer updated successfully",
      offer,
    });
  } catch (error) {
    console.error("Update Seasonal Offer Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update seasonal offer",
    });
  }
};

// ==========================================
// DELETE SEASONAL OFFER
// DELETE /api/offers/seasonal/:id
// ==========================================

exports.deleteSeasonalOffer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid seasonal offer ID",
      });
    }

    const offer = await SeasonalOffer.findByIdAndDelete(id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Seasonal offer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Seasonal offer deleted successfully",
      offer,
    });
  } catch (error) {
    console.error("Delete Seasonal Offer Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete seasonal offer",
    });
  }
};
