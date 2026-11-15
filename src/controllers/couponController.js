
const Coupon = require("../models/Coupon");

// =====================================
// CREATE COUPON - POST
// =====================================

exports.createCoupon = async (req, res) => {
  try {
    const {
      code,
      title,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      startDate,
      endDate,
      usageLimit,
      status,
    } = req.body;

    if (!code || !title) {
      return res.status(400).json({
        success: false,
        message: "Coupon code and title are required",
      });
    }

    const upperCode = code.trim().toUpperCase();

    const existingCoupon = await Coupon.findOne({
      code: upperCode,
    });

    if (existingCoupon) {
      return res.status(409).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    const coupon = await Coupon.create({
      code: upperCode,
      title,
      description,
      discountType,
      discountValue:
        discountType === "free-delivery" ? 0 : discountValue,
      minOrderAmount: minOrderAmount ?? 0,
      maxDiscount: maxDiscount ?? null,
      startDate: startDate || null,
      endDate: endDate || null,
      usageLimit: usageLimit ?? null,
      status,
    });

    return res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon,
    });

  } catch (error) {
    console.error("Create Coupon Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =====================================
// GET ALL COUPONS - GET
// =====================================

exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: coupons.length,
      coupons,
    });

  } catch (error) {
    console.error("Get Coupons Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =====================================
// GET SINGLE COUPON - GET BY ID
// =====================================

exports.getCouponById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!require("mongoose").isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon ID",
      });
    }

    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.status(200).json({
      success: true,
      coupon,
    });

  } catch (error) {
    console.error("Get Coupon Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =====================================
// UPDATE COUPON - PUT
// =====================================

exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    if (!require("mongoose").isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon ID",
      });
    }

    const existingCoupon = await Coupon.findById(id);

    if (!existingCoupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    const allowedFields = [
      "code",
      "title",
      "description",
      "discountType",
      "discountValue",
      "minOrderAmount",
      "maxDiscount",
      "startDate",
      "endDate",
      "usageLimit",
      "status",
    ];

    const updateData = {};

    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updateData[field] = req.body[field];
      }
    });

    if (updateData.code !== undefined) {
      updateData.code = updateData.code.trim().toUpperCase();

      const duplicate = await Coupon.findOne({
        code: updateData.code,
        _id: { $ne: id },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "Coupon code already exists",
        });
      }
    }

    if (updateData.discountType === "free-delivery") {
      updateData.discountValue = 0;
    }

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      coupon,
    });

  } catch (error) {
    console.error("Update Coupon Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =====================================
// DELETE COUPON - DELETE
// =====================================

exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    if (!require("mongoose").isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon ID",
      });
    }

    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
      coupon,
    });

  } catch (error) {
    console.error("Delete Coupon Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
