
const DeliverySettings = require("../models/DeliverySettings");

// GET DELIVERY SETTINGS
exports.getDeliverySettings = async (req, res) => {
  try {
    let settings = await DeliverySettings.findOne({ key: "default" });

    if (!settings) {
      settings = await DeliverySettings.create({
        key: "default",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Delivery settings fetched successfully",
      settings,
    });
  } catch (error) {
    console.error("Get Delivery Settings Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch delivery settings",
    });
  }
};

// UPDATE DELIVERY SETTINGS (ADMIN)
exports.updateDeliverySettings = async (req, res) => {
  try {
    const {
      deliveryCharge,
      isFreeDeliveryEnabled,
      freeDeliveryThreshold,
    } = req.body;

    if (
      deliveryCharge !== undefined &&
      (!Number.isFinite(Number(deliveryCharge)) ||
        Number(deliveryCharge) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery charge",
      });
    }

    if (
      freeDeliveryThreshold !== undefined &&
      (!Number.isFinite(Number(freeDeliveryThreshold)) ||
        Number(freeDeliveryThreshold) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid free delivery threshold",
      });
    }

    if (
      isFreeDeliveryEnabled !== undefined &&
      typeof isFreeDeliveryEnabled !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "isFreeDeliveryEnabled must be true or false",
      });
    }

    const update = {};

    if (deliveryCharge !== undefined) {
      update.deliveryCharge = Number(deliveryCharge);
    }

    if (isFreeDeliveryEnabled !== undefined) {
      update.isFreeDeliveryEnabled = isFreeDeliveryEnabled;
    }

    if (freeDeliveryThreshold !== undefined) {
      update.freeDeliveryThreshold = Number(freeDeliveryThreshold);
    }

    const settings = await DeliverySettings.findOneAndUpdate(
      { key: "default" },
      {
        $set: update,
        $setOnInsert: { key: "default" },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Delivery settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Update Delivery Settings Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update delivery settings",
    });
  }
};
