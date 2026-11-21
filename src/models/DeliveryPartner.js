
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Reusable Cloudinary file schema
const uploadedFileSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      default: "",
    },
    publicId: {
      type: String,
      default: "",
    },
  },
  {
    _id: false,
  }
);

const deliveryPartnerSchema = new mongoose.Schema(
  {
    // Personal Details
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    dateOfBirth: {
      type: Date,
      required: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    city: {
      type: String,
      required: true,
    },

    pincode: {
      type: String,
      required: true,
    },

    // Vehicle Details
    vehicleType: {
      type: String,
      required: true,
    },

    vehicleNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    // Document Numbers
    drivingLicence: {
      type: String,
      required: true,
      trim: true,
    },

    aadhaarNumber: {
      type: String,
      required: true,
      select: false,
    },

    panNumber: {
      type: String,
      required: true,
      uppercase: true,
      select: false,
    },

    // Uploaded Documents
    documents: {
      vehiclePhoto: {
        type: uploadedFileSchema,
        default: () => ({}),
      },

      aadhaar: {
        type: uploadedFileSchema,
        default: () => ({}),
      },

      pan: {
        type: uploadedFileSchema,
        default: () => ({}),
      },

      drivingLicence: {
        type: uploadedFileSchema,
        default: () => ({}),
      },

      profilePhoto: {
        type: uploadedFileSchema,
        default: () => ({}),
      },

      bankDocument: {
        type: uploadedFileSchema,
        default: () => ({}),
      },
    },

    // Bank Details
    accountHolder: {
      type: String,
      required: true,
    },

    accountNumber: {
      type: String,
      required: true,
      select: false,
    },

    ifscCode: {
      type: String,
      required: true,
      uppercase: true,
    },

    bankName: {
      type: String,
      required: true,
    },

    // Admin Verification
    applicationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    rejectionReason: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isOnline: {
      type: Boolean,
      default: false,
    },

    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Password hashing
deliveryPartnerSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 12);
});

// Password comparison
deliveryPartnerSchema.methods.comparePassword = async function (
  enteredPassword
) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model(
  "DeliveryPartner",
  deliveryPartnerSchema
);
