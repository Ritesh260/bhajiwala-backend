
const {
  calculateCheckout,
} = require("../utils/checkoutHelpers");

// POST /api/user/checkout/summary
exports.getCheckoutSummary = async (req, res) => {
  try {
    const { addressId, couponCode } = req.body;

    if (!addressId) {
      return res.status(400).json({
        success: false,
        message: "Please select a delivery address",
      });
    }

    const checkout = await calculateCheckout({
      userId: req.user.id,
      addressId,
      couponCode,
    });

    return res.status(200).json({
      success: true,
      message: "Checkout summary fetched successfully",

      summary: {
        items: checkout.items.map((item) => ({
          productId: item.product._id,
          name: item.productName,
          image: item.productImage,
          variantId: item.variantId,
          unit: item.unit,
          unitValue: item.unitValue,
          quantity: item.quantity,
          originalPrice: item.originalPrice,
          sellingPrice: item.sellingPrice,
          lineTotal: item.lineTotal,
        })),

        address: checkout.address,

        coupon: checkout.coupon
          ? {
              code: checkout.coupon.code,
              discountType: checkout.coupon.discountType,
              discountAmount: checkout.couponDiscount,
            }
          : null,

        subtotal: checkout.subtotal,
        productDiscount: checkout.productDiscount,
        couponDiscount: checkout.couponDiscount,
        deliveryCharge: checkout.deliveryCharge,
        totalAmount: checkout.totalAmount,

        paymentMethod: "COD",
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to calculate checkout",
    });
  }
};
