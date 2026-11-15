const mongoose = require("mongoose");
const ComboOffer = require("../models/ComboOffer");
const cloudinary = require("../config/cloudinary");

// ==========================================
// HELPER: PARSE BOOLEAN
// ==========================================

const parseBoolean = (value) => {
  return value === true || value === "true";
};

// ==========================================
// HELPER: PARSE COMBO ITEMS
// ==========================================

const parseItems = (items) => {
  let parsedItems = items;

  if (typeof items === "string") {
    parsedItems = JSON.parse(items);
  }

  if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
    throw new Error("At least one product is required.");
  }

  return parsedItems.map((item) => {
    const productId =
      item.product?._id || item.product;

    if (!mongoose.isValidObjectId(productId)) {
      throw new Error("Invalid product ID.");
    }

    const price = Number(item.price);
    const quantity = Number(item.quantity);

    if (!Number.isFinite(price) || price < 0) {
      throw new Error("Invalid product price.");
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      throw new Error("Product quantity must be at least 1.");
    }

    return {
      product: productId,
      name: item.name || item.product?.name || "Product",
      price,
      quantity,
    };
  });
};

// ==========================================
// HELPER: CALCULATE ORIGINAL PRICE
// ==========================================

const calculateOldPrice = (items) => {
  return items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
};

// ==========================================
// HELPER: UPLOAD IMAGE TO CLOUDINARY
// ==========================================

const uploadImage = async (file) => {
  if (!file) return "";

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "bhajiwala/combos",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result.secure_url);
      }
    );

    stream.end(file.buffer);
  });
};

// ==========================================
// CREATE COMBO OFFER
// POST /api/offers/combos
// ==========================================

exports.createCombo = async (req, res) => {
  try {
    const {
      title,
      description,
      items,
      price,
      startDate,
      endDate,
      status,
      featured,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Combo title is required.",
      });
    }

    if (!items) {
      return res.status(400).json({
        success: false,
        message: "Combo products are required.",
      });
    }

    const parsedItems = parseItems(items);

    const oldPrice = calculateOldPrice(parsedItems);
    const comboPrice = Number(price);

    if (!Number.isFinite(comboPrice) || comboPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid combo price.",
      });
    }

    if (comboPrice >= oldPrice) {
      return res.status(400).json({
        success: false,
        message: "Combo price must be less than original price.",
      });
    }

    if (
      startDate &&
      endDate &&
      new Date(endDate) < new Date(startDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date.",
      });
    }

    let image = "";

    if (req.file) {
      image = await uploadImage(req.file);
    }

    const combo = await ComboOffer.create({
      title: title.trim(),
      description: description || "",
      items: parsedItems,
      oldPrice,
      price: comboPrice,
      image,
      startDate: startDate || null,
      endDate: endDate || null,
      status: status || "Active",
      featured: parseBoolean(featured),
    });

    return res.status(201).json({
      success: true,
      message: "Combo offer created successfully.",
      combo,
    });
  } catch (error) {
    console.error("Create Combo Error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create combo offer.",
    });
  }
};

// ==========================================
// GET ALL COMBO OFFERS
// GET /api/offers/combos
// ==========================================

exports.getAllCombos = async (req, res) => {
  try {
    const combos = await ComboOffer.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: combos.length,
      combos,
    });
  } catch (error) {
    console.error("Get Combos Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch combo offers.",
    });
  }
};

// ==========================================
// GET SINGLE COMBO OFFER
// GET /api/offers/combos/:id
// ==========================================

exports.getComboById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid combo ID.",
      });
    }

    const combo = await ComboOffer.findById(id);

    if (!combo) {
      return res.status(404).json({
        success: false,
        message: "Combo offer not found.",
      });
    }

    return res.status(200).json({
      success: true,
      combo,
    });
  } catch (error) {
    console.error("Get Combo Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch combo offer.",
    });
  }
};

// ==========================================
// UPDATE COMBO OFFER
// PUT /api/offers/combos/:id
// ==========================================

exports.updateCombo = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid combo ID.",
      });
    }

    const combo = await ComboOffer.findById(id);

    if (!combo) {
      return res.status(404).json({
        success: false,
        message: "Combo offer not found.",
      });
    }

    const {
      title,
      description,
      items,
      price,
      startDate,
      endDate,
      status,
      featured,
    } = req.body;

    const updatedItems = items
      ? parseItems(items)
      : combo.items;

    const oldPrice = calculateOldPrice(updatedItems);

    const comboPrice =
      price !== undefined && price !== ""
        ? Number(price)
        : combo.price;

    if (!Number.isFinite(comboPrice) || comboPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid combo price.",
      });
    }

    if (comboPrice >= oldPrice) {
      return res.status(400).json({
        success: false,
        message: "Combo price must be less than original price.",
      });
    }

    const finalStartDate =
      startDate !== undefined
        ? startDate || null
        : combo.startDate;

    const finalEndDate =
      endDate !== undefined
        ? endDate || null
        : combo.endDate;

    if (
      finalStartDate &&
      finalEndDate &&
      new Date(finalEndDate) < new Date(finalStartDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date.",
      });
    }

    let image = combo.image;

    if (req.file) {
      image = await uploadImage(req.file);
    }

    combo.title =
      title !== undefined ? title.trim() : combo.title;

    combo.description =
      description !== undefined
        ? description
        : combo.description;

    combo.items = updatedItems;
    combo.oldPrice = oldPrice;
    combo.price = comboPrice;
    combo.image = image;
    combo.startDate = finalStartDate;
    combo.endDate = finalEndDate;

    if (status !== undefined) {
      combo.status = status;
    }

    if (featured !== undefined) {
      combo.featured = parseBoolean(featured);
    }

    await combo.save();

    return res.status(200).json({
      success: true,
      message: "Combo offer updated successfully.",
      combo,
    });
  } catch (error) {
    console.error("Update Combo Error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update combo offer.",
    });
  }
};

// ==========================================
// DELETE COMBO OFFER
// DELETE /api/offers/combos/:id
// ==========================================

exports.deleteCombo = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid combo ID.",
      });
    }

    const combo = await ComboOffer.findByIdAndDelete(id);

    if (!combo) {
      return res.status(404).json({
        success: false,
        message: "Combo offer not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Combo offer deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Combo Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete combo offer.",
    });
  }
};