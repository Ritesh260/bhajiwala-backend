
const Cart = require("../models/Cart");
const Address = require("../models/Address");
const Product = require("../models/Products");
const Coupon = require("../models/Coupon");
const DeliverySettings = require("../models/DeliverySettings");

const roundMoney = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

// Convert variant quantity into parent product stock unit
const convertUnit = (value, fromUnit, toUnit) => {
  if (fromUnit === toUnit) return value;

  if (fromUnit === "Gram" && toUnit === "Kg") {
    return value / 1000;
  }

  if (fromUnit === "Kg" && toUnit === "Gram") {
    return value * 1000;
  }

  throw new Error(
    `Cannot convert ${fromUnit} into ${toUnit}`
  );
};

const getProductPricing = (product, variantId) => {
  let selectedVariant = null;

  if (product.variants && product.variants.length > 0) {
    if (!variantId) {
      throw new Error(
        `${product.name}: Please select a product variant`
      );
    }

    selectedVariant = product.variants.id(variantId);

    if (!selectedVariant) {
      throw new Error(
        `${product.name}: Selected variant not found`
      );
    }
  } else if (variantId) {
    throw new Error(
      `${product.name}: Invalid variant selected`
    );
  }

  const originalPrice = Number(
    selectedVariant
      ? selectedVariant.price
      : product.price
  );

  const discountPrice = Number(
    selectedVariant
      ? selectedVariant.discountPrice
      : product.discountPrice
  );

  const sellingPrice =
    discountPrice > 0 && discountPrice < originalPrice
      ? discountPrice
      : originalPrice;

  const unitValue = Number(
    selectedVariant
      ? selectedVariant.unitValue
      : product.unitValue
  );

  const unit = selectedVariant
    ? selectedVariant.unit
    : product.unit;

  return {
    selectedVariant,
    originalPrice: roundMoney(originalPrice),
    sellingPrice: roundMoney(sellingPrice),
    unitValue,
    unit,
  };
};

const calculateCheckout = async ({
  userId,
  addressId,
  couponCode,
}) => {
  const [cart, address] = await Promise.all([
    Cart.findOne({ user: userId }).populate("items.product"),
    Address.findOne({
      _id: addressId,
      user: userId,
    }),
  ]);

  if (!cart || !cart.items.length) {
    throw new Error("Your cart is empty");
  }

  if (!address) {
    throw new Error("Please select a valid delivery address");
  }

  const items = [];
  const stockUsage = new Map();

  let subtotal = 0;
  let productDiscount = 0;

  for (const cartItem of cart.items) {
    const product = cartItem.product;

    if (!product || product.status !== "Active") {
      throw new Error(
        "One or more products are no longer available"
      );
    }

    const quantity = Number(cartItem.quantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error("Invalid cart quantity");
    }

    const pricing = getProductPricing(
      product,
      cartItem.variantId
    );

    const lineTotal = roundMoney(
      pricing.sellingPrice * quantity
    );

    const lineOriginalTotal = roundMoney(
      pricing.originalPrice * quantity
    );

    const stockConsumption = roundMoney(
      convertUnit(
        pricing.unitValue * quantity,
        pricing.unit,
        product.unit
      ) / product.unitValue
    );

    // product.stock is measured in parent product units.
    // unitValue is the quantity represented by one parent unit.
    const totalStockUnits = stockConsumption;

    const previousUsage = stockUsage.get(
      String(product._id)
    ) || 0;

    stockUsage.set(
      String(product._id),
      roundMoney(previousUsage + totalStockUnits)
    );

    items.push({
      product,
      variantId: pricing.selectedVariant
        ? pricing.selectedVariant._id
        : null,
      productName: product.name,
      productImage: product.images?.[0] || "",
      unit: pricing.unit,
      unitValue: pricing.unitValue,
      originalPrice: pricing.originalPrice,
      sellingPrice: pricing.sellingPrice,
      quantity,
      lineTotal,
      stockConsumption: totalStockUnits,
    });

    subtotal += lineTotal;
    productDiscount +=
      lineOriginalTotal - lineTotal;
  }

  subtotal = roundMoney(subtotal);
  productDiscount = roundMoney(productDiscount);

  // Validate coupon
  let selectedCoupon = null;
  let couponDiscount = 0;

  if (couponCode && String(couponCode).trim()) {
    const normalizedCode = String(couponCode)
      .trim()
      .toUpperCase();

    selectedCoupon = await Coupon.findOne({
      code: normalizedCode,
      status: "Active",
    });

    if (!selectedCoupon) {
      throw new Error("Invalid or inactive coupon");
    }

    const now = new Date();

    if (
      selectedCoupon.startDate &&
      now < selectedCoupon.startDate
    ) {
      throw new Error("This coupon is not active yet");
    }

    if (
      selectedCoupon.endDate &&
      now > selectedCoupon.endDate
    ) {
      throw new Error("This coupon has expired");
    }

    if (
      selectedCoupon.usageLimit !== null &&
      selectedCoupon.usageLimit !== undefined &&
      selectedCoupon.usedCount >= selectedCoupon.usageLimit
    ) {
      throw new Error("Coupon usage limit reached");
    }

    if (subtotal < selectedCoupon.minOrderAmount) {
      throw new Error(
        `Minimum order amount for this coupon is ₹${selectedCoupon.minOrderAmount}`
      );
    }

    if (selectedCoupon.discountType === "percentage") {
      couponDiscount =
        subtotal * (selectedCoupon.discountValue / 100);

      if (selectedCoupon.maxDiscount !== null &&
          selectedCoupon.maxDiscount !== undefined) {
        couponDiscount = Math.min(
          couponDiscount,
          selectedCoupon.maxDiscount
        );
      }
    } else if (selectedCoupon.discountType === "fixed") {
      couponDiscount = selectedCoupon.discountValue;
    }

    couponDiscount = roundMoney(
      Math.min(couponDiscount, subtotal)
    );
  }

  let settings = await DeliverySettings.findOne({
    key: "default",
  });

  if (!settings) {
    settings = await DeliverySettings.create({
      key: "default",
    });
  }

  let deliveryCharge = Number(settings.deliveryCharge);

  if (
    settings.isFreeDeliveryEnabled &&
    subtotal >= settings.freeDeliveryThreshold
  ) {
    deliveryCharge = 0;
  }

  if (
    selectedCoupon &&
    selectedCoupon.discountType === "free-delivery"
  ) {
    deliveryCharge = 0;
  }

  const totalAmount = roundMoney(
    Math.max(0, subtotal - couponDiscount) + deliveryCharge
  );

  return {
    cart,
    address,
    items,
    stockUsage,
    coupon: selectedCoupon,
    subtotal,
    productDiscount,
    couponDiscount,
    deliveryCharge,
    totalAmount,
  };
};

module.exports = {
  calculateCheckout,
  roundMoney,
};
