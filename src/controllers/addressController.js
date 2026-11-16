
const Address = require("../models/Address");

const allowedTypes = ["Home", "Work", "Other"];

// ==========================================
// GET ALL ADDRESSES
// GET /api/user/addresses
// ==========================================

exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({
      user: req.user.id,
    }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      message: "Addresses fetched successfully",
      count: addresses.length,
      addresses,
    });
  } catch (error) {
    console.error("Get Addresses Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch addresses",
    });
  }
};

// ==========================================
// ADD NEW ADDRESS
// POST /api/user/addresses
// ==========================================

exports.addAddress = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      addressType,
      houseNo,
      area,
      landmark,
      city,
      state,
      pincode,
      isDefault,
    } = req.body;

    if (
      !fullName ||
      !phone ||
      !houseNo ||
      !area ||
      !city ||
      !state ||
      !pincode
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required address fields",
      });
    }

    if (!/^\d{6}$/.test(String(pincode).trim())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 6-digit pincode",
      });
    }

    if (!/^\d{10}$/.test(String(phone).trim())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit phone number",
      });
    }

    if (addressType && !allowedTypes.includes(addressType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid address type",
      });
    }

    const addressCount = await Address.countDocuments({
      user: req.user.id,
    });

    // First address automatically becomes default
    const shouldBeDefault = addressCount === 0 || isDefault === true;

    if (shouldBeDefault) {
      await Address.updateMany(
        { user: req.user.id },
        { $set: { isDefault: false } }
      );
    }

    const address = await Address.create({
      user: req.user.id,
      fullName: fullName.trim(),
      phone: phone.trim(),
      addressType: addressType || "Home",
      houseNo: houseNo.trim(),
      area: area.trim(),
      landmark: landmark?.trim() || "",
      city: city.trim(),
      state: state.trim(),
      pincode: String(pincode).trim(),
      isDefault: shouldBeDefault,
    });

    return res.status(201).json({
      success: true,
      message: "Address added successfully",
      address,
    });
  } catch (error) {
    console.error("Add Address Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add address",
    });
  }
};

// ==========================================
// UPDATE ADDRESS
// PUT /api/user/addresses/:id
// ==========================================

exports.updateAddress = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      addressType,
      houseNo,
      area,
      landmark,
      city,
      state,
      pincode,
      isDefault,
    } = req.body;

    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    if (
      fullName !== undefined && !fullName.trim() ||
      phone !== undefined && !phone.trim() ||
      houseNo !== undefined && !houseNo.trim() ||
      area !== undefined && !area.trim() ||
      city !== undefined && !city.trim() ||
      state !== undefined && !state.trim() ||
      pincode !== undefined && !String(pincode).trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Required address fields cannot be empty",
      });
    }

    if (
      phone !== undefined &&
      !/^\d{10}$/.test(String(phone).trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit phone number",
      });
    }

    if (
      pincode !== undefined &&
      !/^\d{6}$/.test(String(pincode).trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 6-digit pincode",
      });
    }

    if (
      addressType !== undefined &&
      !allowedTypes.includes(addressType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid address type",
      });
    }

    if (fullName !== undefined) address.fullName = fullName.trim();
    if (phone !== undefined) address.phone = phone.trim();
    if (addressType !== undefined) address.addressType = addressType;
    if (houseNo !== undefined) address.houseNo = houseNo.trim();
    if (area !== undefined) address.area = area.trim();
    if (landmark !== undefined) address.landmark = landmark.trim();
    if (city !== undefined) address.city = city.trim();
    if (state !== undefined) address.state = state.trim();
    if (pincode !== undefined) address.pincode = String(pincode).trim();

    if (isDefault === true) {
      await Address.updateMany(
        { user: req.user.id },
        { $set: { isDefault: false } }
      );

      address.isDefault = true;
    }

    await address.save();

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      address,
    });
  } catch (error) {
    console.error("Update Address Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update address",
    });
  }
};

// ==========================================
// DELETE ADDRESS
// DELETE /api/user/addresses/:id
// ==========================================

exports.deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    const wasDefault = address.isDefault;

    await address.deleteOne();

    // If default address was deleted, choose another one
    if (wasDefault) {
      const nextAddress = await Address.findOne({
        user: req.user.id,
      }).sort({ createdAt: -1 });

      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("Delete Address Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete address",
    });
  }
};

// ==========================================
// SET DEFAULT ADDRESS
// PATCH /api/user/addresses/:id/default
// ==========================================

exports.setDefaultAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    await Address.updateMany(
      { user: req.user.id },
      { $set: { isDefault: false } }
    );

    address.isDefault = true;
    await address.save();

    return res.status(200).json({
      success: true,
      message: "Default address updated successfully",
      address,
    });
  } catch (error) {
    console.error("Set Default Address Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to set default address",
    });
  }
};
