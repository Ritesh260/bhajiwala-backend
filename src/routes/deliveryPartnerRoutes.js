
const express = require("express");
const multer = require("multer");

const {
  registerDeliveryPartner,
  loginDeliveryPartner,
  getDeliveryPartnerProfile,
  getApplicationStatus,
  getPartnerDashboard,
} = require("../controllers/deliveryPartnerController");

const {
  verifyDeliveryPartner,
  requireApprovedPartner,
} = require("../middleware/deliveryPartnerAuth");

const router = express.Router();

// Store uploaded files temporarily in memory
const storage = multer.memoryStorage();

// Allowed file types
const fileFilter = (req, file, cb) => {
  const imageOnlyFields = ["vehiclePhoto", "profilePhoto"];

  const allowedImageTypes = [
    "image/jpeg",
    "image/png",
  ];

  const allowedDocumentTypes = [
    "image/jpeg",
    "image/png",
    "application/pdf",
  ];

  const allowedTypes = imageOnlyFields.includes(file.fieldname)
    ? allowedImageTypes
    : allowedDocumentTypes;

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        imageOnlyFields.includes(file.fieldname)
          ? "Vehicle and profile photos must be JPG or PNG"
          : "Documents must be JPG, PNG or PDF"
      )
    );
  }
};

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 6,
  },
});

// All registration uploads
const registrationUpload = upload.fields([
  { name: "vehiclePhoto", maxCount: 1 },
  { name: "aadhaarDocument", maxCount: 1 },
  { name: "panDocument", maxCount: 1 },
  { name: "drivingLicenceDocument", maxCount: 1 },
  { name: "profilePhoto", maxCount: 1 },
  { name: "bankDocument", maxCount: 1 },
]);

// Register delivery partner
router.post(
  "/register",
  registrationUpload,
  registerDeliveryPartner
);

// Login
router.post("/login", loginDeliveryPartner);

// Logged-in partner routes
router.get(
  "/me",
  verifyDeliveryPartner,
  getDeliveryPartnerProfile
);

// Application status
router.get(
  "/application-status",
  verifyDeliveryPartner,
  getApplicationStatus
);

// Dashboard requires approved account
router.get(
  "/dashboard",
  verifyDeliveryPartner,
  requireApprovedPartner,
  getPartnerDashboard
);

module.exports = router;
