
const jwt = require("jsonwebtoken");
const DeliveryPartner = require("../models/DeliveryPartner");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const sendEmail = require("../utils/sendEmail");
const generateToken = (partner) => {
  return jwt.sign(
    {
      id: partner._id,
      role: "deliveryPartner",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// REGISTER DELIVERY PARTNER
exports.registerDeliveryPartner = async (req, res) => {
  try {
    const {
      fullName,
      mobile,
      email,
      password,
      confirmPassword,
      dateOfBirth,
      gender,
      address,
      city,
      pincode,
      vehicleType,
      vehicleNumber,
      drivingLicence,
      aadhaarNumber,
      panNumber,
      accountHolder,
      accountNumber,
      ifscCode,
      bankName,
    } = req.body;

    // Required fields
    const requiredFields = {
      fullName,
      mobile,
      email,
      password,
      confirmPassword,
      dateOfBirth,
      gender,
      address,
      city,
      pincode,
      vehicleType,
      vehicleNumber,
      drivingLicence,
      aadhaarNumber,
      panNumber,
      accountHolder,
      accountNumber,
      ifscCode,
      bankName,
    };

    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value || !String(value).trim()) {
        return res.status(400).json({
          success: false,
          message: `${key} is required`,
        });
      }
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10 digit mobile number",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (!/^\d{12}$/.test(aadhaarNumber)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 12 digit Aadhaar number",
      });
    }

    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(panNumber)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid PAN number",
      });
    }

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifscCode)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid IFSC code",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check existing partner
    const existingPartner = await DeliveryPartner.findOne({
      $or: [
        { mobile },
        { email: normalizedEmail },
      ],
    });

    if (existingPartner) {
      return res.status(409).json({
        success: false,
        message: "An account with this mobile number or email already exists",
      });
    }

    // Upload registration files to Cloudinary
    const files = req.files || {};

    const uploadDocument = async (fieldName, folder) => {
      const file = files[fieldName]?.[0];

      if (!file) return undefined;

      return uploadToCloudinary(
        file.buffer,
        folder,
        file.mimetype
      );
    };

    const [
      vehiclePhoto,
      aadhaarDoc,
      panDoc,
      licenceDoc,
      profilePhoto,
      bankDocument,
    ] = await Promise.all([
      uploadDocument("vehiclePhoto", "delivery-partners/vehicle-photos"),
      uploadDocument("aadhaarDocument", "delivery-partners/aadhaar"),
      uploadDocument("panDocument", "delivery-partners/pan"),
      uploadDocument("drivingLicenceDocument", "delivery-partners/licence"),
      uploadDocument("profilePhoto", "delivery-partners/profile-photos"),
      uploadDocument("bankDocument", "delivery-partners/bank-documents"),
    ]);

    // Store uploaded file details
    const documents = {
      vehiclePhoto: vehiclePhoto || {},
      aadhaar: aadhaarDoc || {},
      pan: panDoc || {},
      drivingLicence: licenceDoc || {},
      profilePhoto: profilePhoto || {},
      bankDocument: bankDocument || {},
    };

    // Create delivery partner
    const partner = await DeliveryPartner.create({
      fullName: fullName.trim(),
      mobile,
      email: normalizedEmail,
      password,
      dateOfBirth,
      gender,
      address,
      city,
      pincode,
      vehicleType,
      vehicleNumber,
      drivingLicence,
      aadhaarNumber,
      panNumber,
      documents,
      accountHolder,
      accountNumber,
      ifscCode,
      bankName,
      applicationStatus: "pending",
    });
// Send registration confirmation email
const emailResult = await sendEmail({
  to: partner.email,
  subject: "BhajiWala - Registration Successful",
  text: `Hello ${partner.fullName}, your delivery partner registration has been submitted successfully. Your application is pending verification.`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; color: #333;">
      <h2 style="color: #15803d;">Welcome to BhajiWala!</h2>

      <p>Hello <strong>${partner.fullName}</strong>,</p>

      <p>Your delivery partner registration has been submitted successfully.</p>

      <div style="background: #f0fdf4; padding: 15px; border-radius: 10px;">
        <p><strong>Application ID:</strong> ${partner._id}</p>
        <p><strong>Status:</strong> Pending Verification</p>
      </div>

      <p>Our team will review your application and notify you about the approval status.</p>

      <p>Thank you for joining BhajiWala!</p>
      <strong>Team BhajiWala</strong>
    </div>
  `,
});

if (!emailResult.success) {
  console.error("Registration email could not be sent:", emailResult.message);
}
    return res.status(201).json({
      success: true,
      message:
        "Registration submitted successfully. Your application is pending verification.",
      data: {
        applicationId: partner._id,
        fullName: partner.fullName,
        applicationStatus: partner.applicationStatus,
        createdAt: partner.createdAt,
      },
    });
  } catch (error) {
    console.error("Delivery Partner Registration Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Mobile number or email already registered",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

// LOGIN DELIVERY PARTNER
exports.loginDeliveryPartner = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Mobile/email and password are required",
      });
    }

    const partner = await DeliveryPartner.findOne({
      $or: [
        { mobile: identifier },
        { email: identifier.toLowerCase() },
      ],
    }).select("+password");

    if (!partner) {
      return res.status(401).json({
        success: false,
        message: "Invalid login credentials",
      });
    }

    const isMatch = await partner.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid login credentials",
      });
    }

    if (!partner.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    const token = generateToken(partner);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      applicationStatus: partner.applicationStatus,
      data: {
        id: partner._id,
        fullName: partner.fullName,
        mobile: partner.mobile,
        email: partner.email,
        applicationStatus: partner.applicationStatus,
      },
    });
  } catch (error) {
    console.error("Delivery Partner Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

// GET LOGGED-IN PARTNER PROFILE
exports.getDeliveryPartnerProfile = async (req, res) => {
  try {
    const partner = await DeliveryPartner.findById(
      req.deliveryPartner._id
    ).select("-password -aadhaarNumber -panNumber -accountNumber");

    return res.status(200).json({
      success: true,
      data: partner,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch profile",
    });
  }
};

// GET APPLICATION STATUS
exports.getApplicationStatus = async (req, res) => {
  try {
    const partner = await DeliveryPartner.findById(
      req.deliveryPartner._id
    ).select(
      "fullName applicationStatus rejectionReason createdAt approvedAt"
    );

    return res.status(200).json({
      success: true,
      data: partner,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch application status",
    });
  }
};

// DELIVERY PARTNER DASHBOARD
exports.getPartnerDashboard = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Welcome to your Delivery Partner Dashboard",
    partner: {
      id: req.deliveryPartner._id,
      fullName: req.deliveryPartner.fullName,
      applicationStatus: req.deliveryPartner.applicationStatus,
    },
  });
};
