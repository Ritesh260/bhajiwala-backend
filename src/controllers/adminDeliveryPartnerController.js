
const mongoose = require("mongoose");
const DeliveryPartner = require("../models/DeliveryPartner");

const sendEmail = require("../utils/sendEmail");

const approvalEmail = require("../templates/emails/approvalEmail");
const rejectionEmail = require("../templates/emails/rejectionEmail");

// ============================================
// GET ALL DELIVERY PARTNERS
// ============================================
exports.getAllDeliveryPartners = async (req, res) => {
  try {
    const { search, status, vehicle } = req.query;

    const query = {};

    // Application status filter
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query.applicationStatus = status;
    }

    // Vehicle filter
    if (vehicle) {
      query.vehicleType = vehicle;
    }

    // Search by name, mobile or email
    if (search && search.trim()) {
      const safeSearch = search.trim().replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      const searchRegex = new RegExp(safeSearch, "i");

      query.$or = [
        { fullName: searchRegex },
        { mobile: searchRegex },
        { email: searchRegex },
      ];
    }

    const [partners, total, pending, approved, rejected] =
      await Promise.all([
        DeliveryPartner.find(query)
          .select("-password")
          .sort({ createdAt: -1 })
          .lean(),

        DeliveryPartner.countDocuments(),

        DeliveryPartner.countDocuments({
          applicationStatus: "pending",
        }),

        DeliveryPartner.countDocuments({
          applicationStatus: "approved",
        }),

        DeliveryPartner.countDocuments({
          applicationStatus: "rejected",
        }),
      ]);

    return res.status(200).json({
      success: true,
      message: "Delivery partners fetched successfully.",
      counts: {
        total,
        pending,
        approved,
        rejected,
      },
      data: partners,
    });
  } catch (error) {
    console.error("Get Delivery Partners Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch delivery partners.",
    });
  }
};

// ============================================
// GET SINGLE DELIVERY PARTNER DETAILS
// ============================================
exports.getDeliveryPartnerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery partner ID.",
      });
    }

    const partner = await DeliveryPartner.findById(id)
      .select("-password")
      .lean();

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Delivery partner details fetched successfully.",
      data: partner,
    });
  } catch (error) {
    console.error("Get Delivery Partner Details Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch delivery partner details.",
    });
  }
};

// ============================================
// APPROVE DELIVERY PARTNER
// ============================================
exports.approveDeliveryPartner = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery partner ID.",
      });
    }

    const partner = await DeliveryPartner.findById(id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found.",
      });
    }

    // Prevent duplicate approval emails
    const shouldSendEmail = partner.applicationStatus !== "approved";

    // Update approval status
    partner.applicationStatus = "approved";
    partner.rejectionReason = "";
    partner.isActive = true;
    partner.approvedAt = new Date();

    await partner.save();

    // Send approval email
    if (shouldSendEmail && partner.email) {
      try {
        const emailTemplate = approvalEmail({
          fullName: partner.fullName,
          approvedDate: partner.approvedAt,
          loginUrl: process.env.DELIVERY_PARTNER_LOGIN_URL,
        });

        await sendEmail({
          to: partner.email,
          ...emailTemplate,
        });
      } catch (emailError) {
        console.error(
          "Delivery Partner Approval Email Error:",
          emailError
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Delivery partner approved successfully.",
      data: partner,
    });
  } catch (error) {
    console.error("Approve Delivery Partner Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to approve delivery partner.",
    });
  }
};

// ============================================
// REJECT DELIVERY PARTNER
// ============================================
exports.rejectDeliveryPartner = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery partner ID.",
      });
    }

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required.",
      });
    }

    const partner = await DeliveryPartner.findById(id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found.",
      });
    }

    const newReason = rejectionReason.trim();

    // Prevent duplicate rejection emails for the same decision
    const shouldSendEmail =
      partner.applicationStatus !== "rejected" ||
      partner.rejectionReason !== newReason;

    // Update rejection status
    partner.applicationStatus = "rejected";
    partner.rejectionReason = newReason;
    partner.isActive = false;
    partner.approvedAt = null;

    await partner.save();

    // Send rejection email
    if (shouldSendEmail && partner.email) {
      try {
        const emailTemplate = rejectionEmail({
          fullName: partner.fullName,
          rejectionReason: partner.rejectionReason,
        });

        await sendEmail({
          to: partner.email,
          ...emailTemplate,
        });
      } catch (emailError) {
        console.error(
          "Delivery Partner Rejection Email Error:",
          emailError
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Delivery partner rejected successfully.",
      data: partner,
    });
  } catch (error) {
    console.error("Reject Delivery Partner Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reject delivery partner.",
    });
  }
};
