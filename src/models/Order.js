
const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    productName: {
      type: String,
      required: true,
    },

    productImage: {
      type: String,
      default: "",
    },

    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    unit: {
      type: String,
      required: true,
    },

    unitValue: {
      type: Number,
      required: true,
    },

    originalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },

    // Parent product stock se kitna deduct hua
    stockConsumption: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

const addressSnapshotSchema = new mongoose.Schema(
  {
    fullName: String,
    phone: String,
    addressType: String,
    houseNo: String,
    area: String,
    landmark: String,
    city: String,
    state: String,
    pincode: String,
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    note: {
      type: String,
      default: "",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const deliveryPartnerSchema = new mongoose.Schema(
  {
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    name: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    trackingLatitude: {
      type: Number,
      default: null,
    },
    trackingLongitude: {
      type: Number,
      default: null,
    },
    estimatedDelivery: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
    },

    deliveryAddress: {
      type: addressSnapshotSchema,
      required: true,
    },

    coupon: {
      code: {
        type: String,
        default: "",
      },
      discountType: {
        type: String,
        default: "",
      },
      discountAmount: {
        type: Number,
        default: 0,
      },
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    productDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },

    couponDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },

    deliveryCharge: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["COD"],
      default: "COD",
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },

    orderStatus: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Preparing",
        "Ready for Pickup",
        "Picked Up",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
    },

    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },

    deliveryPartner: {
      type: deliveryPartnerSchema,
      default: () => ({}),
    },

    notes: {
      type: String,
      default: "",
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
