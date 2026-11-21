
const mongoose = require("mongoose");

// ==========================================
// PRODUCT VARIANT SCHEMA
// Variants only define quantity and pricing.
// Stock is managed by the parent Product.
// ==========================================

const productVariantSchema = new mongoose.Schema(
  {
    unitValue: {
      type: Number,
      required: true,
      min: 0.001,
    },

    unit: {
      type: String,
      enum: [
        "Kg",
        "Gram",
        "Piece",
        "Dozen",
        "Bundle",
      ],
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discountPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    costPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    sku: {
      type: String,
      trim: true,
    },
  },
  {
    _id: true,
  }
);

// ==========================================
// PRODUCT SCHEMA
// ==========================================

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    brand: {
      type: String,
      trim: true,
    },

    shortDescription: {
      type: String,
    },

    description: {
      type: String,
    },

    // ==========================================
    // PRODUCT PRICING
    // ==========================================

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discountPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    costPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ==========================================
    // PRODUCT SKU
    // ==========================================

    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    // ==========================================
    // MAIN PRODUCT STOCK
    // Single source of inventory
    // ==========================================

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Main stock measurement
    unit: {
      type: String,
      enum: [
        "Kg",
        "Gram",
        "Piece",
        "Dozen",
        "Bundle",
      ],
      default: "Kg",
    },

    unitValue: {
      type: Number,
      required: true,
      min: 0.001,
      default: 1,
    },

    // ==========================================
    // PRODUCT VARIANTS
    // No separate variant stock
    // ==========================================

    variants: {
      type: [productVariantSchema],
      default: [],
    },

    // ==========================================
    // IMAGES
    // ==========================================

    images: {
      type: [String],
      default: [],
    },

    // ==========================================
    // STATUS
    // ==========================================

    featured: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: [
        "Active",
        "Inactive",
        "Draft",
      ],
      default: "Active",
    },

    // ==========================================
    // SEO
    // ==========================================

    seoTitle: {
      type: String,
    },

    seoDescription: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Product",
  productSchema
);
