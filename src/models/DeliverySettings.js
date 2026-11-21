
const mongoose = require("mongoose");

const deliverySettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "default",
      unique: true,
      required: true,
    },

    deliveryCharge: {
      type: Number,
      default: 30,
      min: 0,
    },

    isFreeDeliveryEnabled: {
      type: Boolean,
      default: false,
    },

    freeDeliveryThreshold: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "DeliverySettings",
  deliverySettingsSchema
);
