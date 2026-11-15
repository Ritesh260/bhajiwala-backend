
const mongoose = require("mongoose");

const seasonalOfferSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Offer title is required"],
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    badge: {
      type: String,
      trim: true,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "SeasonalOffer",
  seasonalOfferSchema
);
