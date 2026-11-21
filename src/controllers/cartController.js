const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Product = require("../models/Products");

// ==========================================
// STOCK CONVERSION HELPER
// Converts variant quantity into parent product unit
// ==========================================

const getStockConsumption = (unitValue, itemUnit, product) => {
  const parentUnit = product.unit;
  const value = Number(unitValue);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Invalid product or variant unit value");
  }

  // Same unit: no conversion required
  if (itemUnit === parentUnit) {
    return value;
  }

  // Weight conversion: Gram <-> Kg
  if (itemUnit === "Gram" && parentUnit === "Kg") {
    return value / 1000;
  }

  if (itemUnit === "Kg" && parentUnit === "Gram") {
    return value * 1000;
  }

  // Do not assume conversions for Piece, Dozen or Bundle
  throw new Error(
    `Cannot convert ${itemUnit} into product stock unit ${parentUnit}`
  );
};

// Get how much stock one cart item consumes
const getItemStockConsumption = (item, product) => {
  if (item.variantId) {
    const variant = product.variants.id(item.variantId);

    if (!variant) {
      throw new Error(`Variant not found for ${product.name}`);
    }

    return getStockConsumption(
      variant.unitValue,
      variant.unit,
      product
    ) * item.quantity;
  }

  return getStockConsumption(
    product.unitValue,
    product.unit,
    product
  ) * item.quantity;
};

// Calculate total stock used by all cart items of a product
const getCartProductUsage = (cart, product) => {
  let totalUsage = 0;

  for (const item of cart.items) {
    if (item.product.toString() !== product._id.toString()) {
      continue;
    }

    totalUsage += getItemStockConsumption(item, product);
  }

  return totalUsage;
};

// ==========================================
// ADD TO CART
// POST /api/user/cart/add
// ==========================================

exports.addToCart = async (req, res) => {
  try {
    const { productId, variantId, quantity = 1 } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
    }

    const product = await Product.findOne({
      _id: productId,
      status: "Active",
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or inactive",
      });
    }

    let selectedVariant = null;

    if (product.variants.length > 0) {
      if (!variantId || !mongoose.Types.ObjectId.isValid(variantId)) {
        return res.status(400).json({
          success: false,
          message: "Please select a valid product variant",
        });
      }

      selectedVariant = product.variants.id(variantId);

      if (!selectedVariant) {
        return res.status(404).json({
          success: false,
          message: "Product variant not found",
        });
      }
    } else if (variantId) {
      return res.status(400).json({
        success: false,
        message: "This product does not have variants",
      });
    }

    let cart = await Cart.findOne({
      user: req.user.id,
    });

    if (!cart) {
      cart = new Cart({
        user: req.user.id,
        items: [],
      });
    }

    const existingItem = cart.items.find((item) => {
      const sameProduct = item.product.toString() === productId;

      const sameVariant = selectedVariant
        ? item.variantId?.toString() === variantId
        : !item.variantId;

      return sameProduct && sameVariant;
    });

    // Calculate current parent stock usage across all variants
    const currentUsage = getCartProductUsage(cart, product);

    // Calculate stock consumed by the requested quantity
    const unitValue = selectedVariant
      ? selectedVariant.unitValue
      : product.unitValue;

    const itemUnit = selectedVariant
      ? selectedVariant.unit
      : product.unit;

    const requestedUsage =
      getStockConsumption(unitValue, itemUnit, product) * quantity;

    const totalUsage = currentUsage + requestedUsage;

    if (totalUsage > product.stock) {
      const remainingStock = Math.max(
        0,
        product.stock - currentUsage
      );

      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Only ${remainingStock} ${product.unit} available for this product.`,
      });
    }

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        variantId: selectedVariant ? variantId : null,
        quantity,
      });
    }

    await cart.save();

    const updatedCart = await Cart.findById(cart._id).populate(
      "items.product"
    );

    return res.status(200).json({
      success: true,
      message: "Product added to cart successfully",
      cart: updatedCart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET CART
// GET /api/user/cart
// ==========================================

exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({
      user: req.user.id,
    }).populate("items.product");

    if (!cart) {
      cart = {
        user: req.user.id,
        items: [],
      };
    }

    return res.status(200).json({
      success: true,
      message: "Cart fetched successfully",
      cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// UPDATE CART QUANTITY
// PATCH /api/user/cart/:itemId
// ==========================================

exports.updateCartQuantity = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart item ID",
      });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
    }

    const cart = await Cart.findOne({
      user: req.user.id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const item = cart.items.id(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    const product = await Product.findOne({
      _id: item.product,
      status: "Active",
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or inactive",
      });
    }

    // Current total stock usage by this product in cart
    const currentUsage = getCartProductUsage(cart, product);

    // Remove the current item's usage from calculation
    const oldItemUsage = getItemStockConsumption(item, product);

    // Calculate usage with the requested new quantity
    const unitValue = item.variantId
      ? product.variants.id(item.variantId).unitValue
      : product.unitValue;

    const itemUnit = item.variantId
      ? product.variants.id(item.variantId).unit
      : product.unit;

    const newItemUsage =
      getStockConsumption(unitValue, itemUnit, product) * quantity;

    const totalUsage = currentUsage - oldItemUsage + newItemUsage;

    if (totalUsage > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available stock is ${product.stock} ${product.unit}.`,
      });
    }

    item.quantity = quantity;

    await cart.save();

    const updatedCart = await Cart.findById(cart._id).populate(
      "items.product"
    );

    return res.status(200).json({
      success: true,
      message: "Cart quantity updated successfully",
      cart: updatedCart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// REMOVE CART ITEM
// DELETE /api/user/cart/:itemId
// ==========================================

exports.removeCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart item ID",
      });
    }

    const cart = await Cart.findOne({
      user: req.user.id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const item = cart.items.id(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    item.deleteOne();

    await cart.save();

    const updatedCart = await Cart.findById(cart._id).populate(
      "items.product"
    );

    return res.status(200).json({
      success: true,
      message: "Product removed from cart",
      cart: updatedCart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// CLEAR CART
// DELETE /api/user/cart/clear
// ==========================================

exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      user: req.user.id,
    });

    if (cart) {
      cart.items = [];
      await cart.save();
    }

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};