
const jwt = require("jsonwebtoken");
const DeliveryPartner = require("../models/DeliveryPartner");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const sendEmail = require("../utils/sendEmail");

// Existing Email Templates
const registrationEmail = require("../templates/emails/registrationEmail");
const loginEmail = require("../templates/emails/loginEmail");

// ============================================
// GENERATE JWT TOKEN
// ============================================
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

// ============================================
// SAFE EMAIL SENDER
// ============================================
const sendTemplateEmail = async (to, createEmailTemplate, emailType) => {
  let stage = "template creation";

  console.info(`[${emailType}] Email flow started`, {
    recipient: to || "(missing)",
  });

  try {
    if (!to) {
      throw new Error("Recipient email is missing");
    }

    console.info(`[${emailType}] Creating email template`);
    const emailTemplate = createEmailTemplate();

    if (!emailTemplate || typeof emailTemplate !== "object") {
      throw new Error("Email template creation returned an invalid result");
    }

    console.info(`[${emailType}] Email template created`, {
      recipient: to,
      subject: emailTemplate.subject,
      hasHtml: Boolean(emailTemplate.html),
      hasText: Boolean(emailTemplate.text),
    });

    stage = "SMTP send";
    console.info(`[${emailType}] Sending email via SMTP`, {
      recipient: to,
      subject: emailTemplate.subject,
    });

    const result = await sendEmail({
      to,
      ...emailTemplate,
    });

    if (!result || !result.success) {
      console.error(`[${emailType}] SMTP send failed`, {
        recipient: to,
        error: result?.message || "Email sender returned an invalid result",
      });
      return false;
    }

    console.info(`[${emailType}] SMTP accepted email`, {
      recipient: to,
      messageId: result.messageId,
    });
    return true;
  } catch (error) {
    console.error(`[${emailType}] ${stage} failed`, {
      recipient: to || "(missing)",
      error: error.message,
      stack: error.stack,
    });
    return false;
  }
};

// ============================================
// REGISTER DELIVERY PARTNER
// ============================================
exports.registerDeliveryPartner = async (req, res) => {
  try {
    console.info("[Delivery Partner Registration] Request received", {
      method: req.method,
      path: req.originalUrl,
    });

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

    // Mobile validation
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10 digit mobile number",
      });
    }

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address",
      });
    }

    // Password validation
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

    // Aadhaar validation
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 12 digit Aadhaar number",
      });
    }

    // PAN validation
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(panNumber)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid PAN number",
      });
    }

    // IFSC validation
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
        message:
          "An account with this mobile number or email already exists",
      });
    }

    // ========================================
    // UPLOAD DOCUMENTS TO CLOUDINARY
    // ========================================

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
      uploadDocument(
        "vehiclePhoto",
        "delivery-partners/vehicle-photos"
      ),
      uploadDocument(
        "aadhaarDocument",
        "delivery-partners/aadhaar"
      ),
      uploadDocument(
        "panDocument",
        "delivery-partners/pan"
      ),
      uploadDocument(
        "drivingLicenceDocument",
        "delivery-partners/licence"
      ),
      uploadDocument(
        "profilePhoto",
        "delivery-partners/profile-photos"
      ),
      uploadDocument(
        "bankDocument",
        "delivery-partners/bank-documents"
      ),
    ]);

    // Store uploaded documents
    const documents = {
      vehiclePhoto: vehiclePhoto || {},
      aadhaar: aadhaarDoc || {},
      pan: panDoc || {},
      drivingLicence: licenceDoc || {},
      profilePhoto: profilePhoto || {},
      bankDocument: bankDocument || {},
    };

    // ========================================
    // CREATE DELIVERY PARTNER
    // ========================================

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

    // ========================================
    // SEND REGISTRATION EMAIL
    // ========================================

    await sendTemplateEmail(
      partner.email,
      () =>
        registrationEmail({
          fullName: partner.fullName,
          applicationId: partner._id.toString(),
        }),
      "Registration Confirmation Email"
    );

    // Registration response
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

// ============================================
// LOGIN DELIVERY PARTNER
// ============================================
exports.loginDeliveryPartner = async (req, res) => {
  try {
    console.info("[Delivery Partner Login] Request received", {
      method: req.method,
      path: req.originalUrl,
    });

    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Mobile/email and password are required",
      });
    }

    const normalizedIdentifier = identifier.trim();

    // Find partner using mobile or email
    const partner = await DeliveryPartner.findOne({
      $or: [
        { mobile: normalizedIdentifier },
        { email: normalizedIdentifier.toLowerCase() },
      ],
    }).select("+password");

    if (!partner) {
      return res.status(401).json({
        success: false,
        message: "Invalid login credentials",
      });
    }

    // Check password
    const isMatch = await partner.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid login credentials",
      });
    }

    // Check account status
    if (!partner.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    // Generate token
    const token = generateToken(partner);

    // ========================================
    // SEND LOGIN SUCCESS EMAIL
    // ========================================

    await sendTemplateEmail(
      partner.email,
      () =>
        loginEmail({
          fullName: partner.fullName,
          loginTime: new Date().toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
          device: req.get("user-agent") || "Not available",
          ipAddress: req.ip || "Not available",
        }),
      "Login Notification Email"
    );

    // Login response
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

// ============================================
// GET LOGGED-IN PARTNER PROFILE
// ============================================
exports.getDeliveryPartnerProfile = async (req, res) => {
  try {
    const partner = await DeliveryPartner.findById(
      req.deliveryPartner._id
    ).select(
      "-password -aadhaarNumber -panNumber -accountNumber"
    );

    return res.status(200).json({
      success: true,
      data: partner,
    });
  } catch (error) {
    console.error("Get Delivery Partner Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch profile",
    });
  }
};

// ============================================
// GET APPLICATION STATUS
// ============================================
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
    console.error("Get Application Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch application status",
    });
  }
};

// ============================================
// DELIVERY PARTNER DASHBOARD
// ============================================
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
