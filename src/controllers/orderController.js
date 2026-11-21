
const mongoose = require("mongoose");
const crypto = require("crypto");

const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Products");
const Coupon = require("../models/Coupon");

const {
  calculateCheckout,
} = require("../utils/checkoutHelpers");

const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Ready for Pickup",
  "Picked Up",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

const makeOrderNumber = () => {
  return `BW-${Date.now()}-${crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase()}`;
};

// ==========================================
// PLACE ORDER
// POST /api/user/orders/place
// ==========================================

exports.placeOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const userId = req.user.id;
    const { addressId, couponCode, notes } = req.body;

    if (!addressId) {
      return res.status(400).json({
        success: false,
        message: "Please select a delivery address",
      });
    }

    if (req.body.paymentMethod && req.body.paymentMethod !== "COD") {
      return res.status(400).json({
        success: false,
        message: "Currently only Cash on Delivery is available",
      });
    }

    let createdOrder;

    await session.withTransaction(async () => {
      const checkout = await calculateCheckout({
        userId,
        addressId,
        couponCode,
      });

      // Deduct stock atomically.
      // Multiple cart lines for the same product are aggregated.
      for (const [productId, requiredStock] of checkout.stockUsage) {
        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: productId,
            status: "Active",
            stock: { $gte: requiredStock },
          },
          {
            $inc: { stock: -requiredStock },
          },
          {
            new: true,
            session,
          }
        );

        if (!updatedProduct) {
          throw new Error(
            "Some products are out of stock. Please update your cart."
          );
        }
      }

      // Atomically reserve coupon usage within this transaction.
      if (checkout.coupon) {
        const couponFilter = {
          _id: checkout.coupon._id,
          status: "Active",
          $and: [
            {
              $or: [
                { startDate: null },
                { startDate: { $exists: false } },
                { startDate: { $lte: new Date() } },
              ],
            },
            {
              $or: [
                { endDate: null },
                { endDate: { $exists: false } },
                { endDate: { $gte: new Date() } },
              ],
            },
            {
              $or: [
                { usageLimit: null },
                { usageLimit: { $exists: false } },
                {
                  $expr: {
                    $lt: ["$usedCount", "$usageLimit"],
                  },
                },
              ],
            },
          ],
        };

        const updatedCoupon = await Coupon.findOneAndUpdate(
          couponFilter,
          { $inc: { usedCount: 1 } },
          { new: true, session }
        );

        if (!updatedCoupon) {
          throw new Error(
            "Coupon is no longer available. Please try another coupon."
          );
        }
      }

      const address = checkout.address;

      const orderItems = checkout.items.map((item) => ({
        product: item.product._id,
        productName: item.productName,
        productImage: item.productImage,
        variantId: item.variantId,
        unit: item.unit,
        unitValue: item.unitValue,
        originalPrice: item.originalPrice,
        sellingPrice: item.sellingPrice,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
        stockConsumption: item.stockConsumption,
      }));

      const orderData = {
        orderNumber: makeOrderNumber(),
        user: userId,
        items: orderItems,

        deliveryAddress: {
          fullName: address.fullName,
          phone: address.phone,
          addressType: address.addressType,
          houseNo: address.houseNo,
          area: address.area,
          landmark: address.landmark,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
        },

        coupon: checkout.coupon
          ? {
              code: checkout.coupon.code,
              discountType: checkout.coupon.discountType,
              discountAmount: checkout.couponDiscount,
            }
          : undefined,

        subtotal: checkout.subtotal,
        productDiscount: checkout.productDiscount,
        couponDiscount: checkout.couponDiscount,
        deliveryCharge: checkout.deliveryCharge,
        totalAmount: checkout.totalAmount,

        paymentMethod: "COD",
        paymentStatus: "Pending",
        orderStatus: "Pending",

        statusHistory: [
          {
            status: "Pending",
            note: "Order placed successfully",
            updatedBy: userId,
          },
        ],

        notes: typeof notes === "string" ? notes.trim() : "",
      };

      const orders = await Order.create(
        [orderData],
        { session }
      );

      createdOrder = orders[0];
    });

    // Clear cart only after successful transaction commit.
    await Cart.findOneAndUpdate(
      { user: userId },
      { $set: { items: [] } }
    );

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: {
        _id: createdOrder._id,
        orderNumber: createdOrder.orderNumber,
        orderStatus: createdOrder.orderStatus,
        paymentMethod: createdOrder.paymentMethod,
        paymentStatus: createdOrder.paymentStatus,
        totalAmount: createdOrder.totalAmount,
        createdAt: createdOrder.createdAt,
      },
    });
  } catch (error) {
    console.error("Place Order Error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to place order",
    });
  } finally {
    await session.endSession();
  }
};

// ==========================================
// CUSTOMER: GET MY ORDERS
// GET /api/user/orders/my
// ==========================================

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get My Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch your orders",
    });
  }
};

// ==========================================
// CUSTOMER: GET SINGLE ORDER
// GET /api/user/orders/:id
// ==========================================

exports.getMyOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const searchConditions = [
      { orderNumber: id },
    ];

    if (mongoose.Types.ObjectId.isValid(id)) {
      searchConditions.push({ _id: id });
    }

    const order = await Order.findOne({
      user: req.user.id,
      $or: searchConditions,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch order",
    });
  }
};

// ==========================================
// CUSTOMER: CANCEL ORDER
// POST /api/user/orders/:id/cancel
// ==========================================

exports.cancelMyOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    let cancelledOrder;

    await session.withTransaction(async () => {
      const order = await Order.findOne({
        _id: req.params.id,
        user: req.user.id,
      }).session(session);

      if (!order) {
        throw new Error("Order not found");
      }

      if (!["Pending", "Confirmed"].includes(order.orderStatus)) {
        throw new Error(
          "This order can no longer be cancelled"
        );
      }

      // Restore stock for each item.
      for (const item of order.items) {
        const restoredProduct = await Product.findByIdAndUpdate(
          item.product,
          {
            $inc: {
              stock: item.stockConsumption,
            },
          },
          { session }
        );

        if (!restoredProduct) {
          throw new Error(
            `Product not found while restoring stock: ${item.productName}`
          );
        }
      }

      order.orderStatus = "Cancelled";
      order.cancelledAt = new Date();

      order.statusHistory.push({
        status: "Cancelled",
        note: "Order cancelled by customer",
        updatedBy: req.user.id,
      });

      await order.save({ session });

      cancelledOrder = order;
    });

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order: cancelledOrder,
    });
  } catch (error) {
    console.error("Cancel Order Error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to cancel order",
    });
  } finally {
    await session.endSession();
  }
};

// ==========================================
// ADMIN: GET ALL ORDERS
// GET /api/user/orders/admin/all
// ==========================================

exports.getAllOrders = async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (status) filter.orderStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    if (search) {
      const regex = new RegExp(
        String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );

      filter.$or = [
        { orderNumber: regex },
        { "deliveryAddress.fullName": regex },
        { "deliveryAddress.phone": regex },
      ];
    }

    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(limit) || 20)
    );

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "name email phone")
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize),

      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: currentPage,
      pages: Math.ceil(total / pageSize),
      orders,
    });
  } catch (error) {
    console.error("Admin Get Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch orders",
    });
  }
};

// ==========================================
// ADMIN: GET SINGLE ORDER
// GET /api/user/orders/admin/:id
// ==========================================

exports.getAdminOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email phone");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Admin Get Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch order",
    });
  }
};

// ==========================================
// ADMIN: UPDATE ORDER STATUS
// PATCH /api/user/orders/admin/:id/status
// ==========================================

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, note } = req.body;

    if (!ORDER_STATUSES.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      order.orderStatus === "Cancelled" ||
      order.orderStatus === "Delivered"
    ) {
      return res.status(400).json({
        success: false,
        message: "This order is already in a final state",
      });
    }

    if (orderStatus === "Cancelled") {
      return res.status(400).json({
        success: false,
        message:
          "Use the cancellation workflow to cancel and restore stock safely",
      });
    }

    order.orderStatus = orderStatus;

    if (orderStatus === "Delivered") {
      order.deliveredAt = new Date();
    }

    order.statusHistory.push({
      status: orderStatus,
      note: typeof note === "string" ? note.trim() : "",
      updatedBy: req.admin._id,
    });

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update Order Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update order status",
    });
  }
};

// ==========================================
// ADMIN: UPDATE COD PAYMENT STATUS
// PATCH /api/user/orders/admin/:id/payment
// ==========================================

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;

    if (!["Pending", "Paid"].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid COD payment status",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentMethod !== "COD") {
      return res.status(400).json({
        success: false,
        message: "This payment method is not supported here",
      });
    }

    if (order.orderStatus === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cancelled order cannot receive payment",
      });
    }

    if (paymentStatus === "Paid" && order.paymentStatus === "Paid") {
      return res.status(400).json({
        success: false,
        message: "Payment is already marked as paid",
      });
    }

    order.paymentStatus = paymentStatus;

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update Payment Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update payment status",
    });
  }
};
