const Product = require("../models/Products");
const cloudinary = require("../config/cloudinary");

// ==========================================
// UPLOAD IMAGE TO CLOUDINARY
// ==========================================

const uploadToCloudinary = (file, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `bhajiwala/${folder}`,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    stream.end(file.buffer);
  });
};

// ==========================================
// NORMALIZE VARIANTS
// ==========================================

const normalizeVariants = (variants) => {
  if (!variants) return [];

  let parsedVariants = variants;

  // FormData se string ke form mein aa sakta hai
  if (typeof variants === "string") {
    try {
      parsedVariants = JSON.parse(variants);
    } catch (error) {
      return [];
    }
  }

  if (!Array.isArray(parsedVariants)) {
    return [];
  }

  return parsedVariants.map((variant) => ({
    unitValue: Number(variant.unitValue),

    unit: variant.unit,

    price: Number(variant.price),

    discountPrice:
      variant.discountPrice !== undefined &&
      variant.discountPrice !== ""
        ? Number(variant.discountPrice)
        : 0,

    costPrice:
      variant.costPrice !== undefined &&
      variant.costPrice !== ""
        ? Number(variant.costPrice)
        : 0,

    stock:
      variant.stock !== undefined &&
      variant.stock !== ""
        ? Number(variant.stock)
        : 0,

    sku: variant.sku || undefined,
  }));
};

// ==========================================
// CREATE PRODUCT
// ==========================================

const createProduct = async (req, res) => {
  try {
    const {
      name,
      slug,
      category,
      brand,
      shortDescription,
      description,

      price,
      discountPrice,
      costPrice,

      sku,
      stock,
      unit,
unitValue,
      variants,

      featured,
      status,

      seoTitle,
      seoDescription,
    } = req.body;

    // ==========================================
    // REQUIRED FIELDS
    // ==========================================

    if (
      !name ||
      !slug ||
      !category ||
      price === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, slug, category and price are required",
      });
    }

    // ==========================================
    // DUPLICATE SLUG
    // ==========================================

    const existingSlug =
      await Product.findOne({ slug });

    if (existingSlug) {
      return res.status(400).json({
        success: false,
        message:
          "Product with this slug already exists",
      });
    }

    // ==========================================
    // DUPLICATE PRODUCT SKU
    // ==========================================

    if (sku) {
      const existingSku =
        await Product.findOne({ sku });

      if (existingSku) {
        return res.status(400).json({
          success: false,
          message:
            "Product with this SKU already exists",
        });
      }
    }

    // ==========================================
    // NORMALIZE VARIANTS
    // ==========================================

    const normalizedVariants =
      normalizeVariants(variants);

    // ==========================================
    // CHECK VARIANT SKUs
    // ==========================================

    for (const variant of normalizedVariants) {
      if (!variant.sku) continue;

      const existingVariantSku =
        await Product.findOne({
          "variants.sku": variant.sku,
        });

      if (existingVariantSku) {
        return res.status(400).json({
          success: false,
          message:
            `Variant SKU ${variant.sku} already exists`,
        });
      }
    }

    // ==========================================
    // PRODUCT IMAGE UPLOAD
    // ==========================================

    const imageUrls = [];

    if (req.files?.images) {
      for (const file of req.files.images) {
        const result =
          await uploadToCloudinary(
            file,
            "products"
          );

        imageUrls.push(
          result.secure_url
        );
      }
    }

    // ==========================================
    // CREATE PRODUCT
    // ==========================================

    const product =
      await Product.create({
        name,
        slug,
        category,
        brand,
        shortDescription,
        description,

        // Old/default fields
        price: Number(price),

        discountPrice:
          discountPrice !== undefined &&
          discountPrice !== ""
            ? Number(discountPrice)
            : 0,

        costPrice:
          costPrice !== undefined &&
          costPrice !== ""
            ? Number(costPrice)
            : 0,

        sku,

        stock:
          stock !== undefined &&
          stock !== ""
            ? Number(stock)
            : 0,

        unit,
        unitValue:
  unitValue !== undefined && unitValue !== ""
    ? Number(unitValue)
    : 1,

        // ==========================================
        // VARIANTS
        // ==========================================

        variants:
          normalizedVariants,

        images: imageUrls,

        featured:
          featured === true ||
          featured === "true",

        status,

        seoTitle,
        seoDescription,
      });

    // ==========================================
    // POPULATE CATEGORY
    // ==========================================

    const populatedProduct =
      await Product.findById(
        product._id
      ).populate(
        "category",
        "name slug"
      );

    // ==========================================
    // RESPONSE
    // ==========================================

    res.status(201).json({
      success: true,
      message:
        "Product created successfully",
      product: populatedProduct,
    });

  } catch (error) {
    console.error(
      "Create Product Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to create product",
      error: error.message,
    });
  }
};

// ==========================================
// GET ALL PRODUCTS
// ==========================================

const getProducts = async (req, res) => {
  try {
    const products =
      await Product.find()
        .populate(
          "category",
          "name slug"
        )
        .sort({
          createdAt: -1,
        });

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });

  } catch (error) {
    console.error(
      "Get Products Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch products",
      error: error.message,
    });
  }
};

// ==========================================
// GET SINGLE PRODUCT
// ==========================================

const getProduct = async (req, res) => {
  try {
    const product =
      await Product.findById(
        req.params.id
      ).populate(
        "category",
        "name slug"
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });

  } catch (error) {
    console.error(
      "Get Product Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch product",
      error: error.message,
    });
  }
};
const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
    }).populate("category", "name slug");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Get Product By Slug Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};
// ==========================================
// UPDATE PRODUCT
// ==========================================

const updateProduct = async (req, res) => {
  try {
    const product =
      await Product.findById(
        req.params.id
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found",
      });
    }

    // ==========================================
    // BASIC FIELDS
    // ==========================================

    const fields = [
      "name",
      "slug",
      "category",
      "brand",
      "shortDescription",
      "description",

      "price",
      "discountPrice",
      "costPrice",

      "sku",
      "stock",
      "unit",

      "featured",
      "status",

      "seoTitle",
      "seoDescription",
    ];

    fields.forEach((field) => {
      if (
        req.body[field] !==
        undefined
      ) {
        product[field] =
          req.body[field];
      }
    });

    // ==========================================
    // CONVERT NUMERIC BASIC FIELDS
    // ==========================================

    if (
      req.body.price !==
      undefined
    ) {
      product.price =
        Number(req.body.price);
    }

    if (
      req.body.discountPrice !==
      undefined
    ) {
      product.discountPrice =
        req.body.discountPrice === ""
          ? 0
          : Number(
              req.body.discountPrice
            );
    }

    if (
      req.body.costPrice !==
      undefined
    ) {
      product.costPrice =
        req.body.costPrice === ""
          ? 0
          : Number(
              req.body.costPrice
            );
    }

    if (
      req.body.stock !==
      undefined
    ) {
      product.stock =
        req.body.stock === ""
          ? 0
          : Number(
              req.body.stock
            );
    }

    // ==========================================
    // FEATURED BOOLEAN
    // ==========================================

    if (
      req.body.featured !==
      undefined
    ) {
      product.featured =
        req.body.featured === true ||
        req.body.featured === "true";
    }

    // ==========================================
    // VARIANTS UPDATE
    // ==========================================

    if (
      req.body.variants !==
      undefined
    ) {
      const normalizedVariants =
        normalizeVariants(
          req.body.variants
        );

      // Check duplicate variant SKUs
      const variantSkus =
        normalizedVariants
          .map(
            (variant) =>
              variant.sku
          )
          .filter(Boolean);

      const duplicateInsideRequest =
        variantSkus.filter(
          (sku, index) =>
            variantSkus.indexOf(
              sku
            ) !== index
        );

      if (
        duplicateInsideRequest.length >
        0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Duplicate variant SKU found",
        });
      }

      // Check variant SKU against other products
      for (
        const variant of normalizedVariants
      ) {
        if (!variant.sku)
          continue;

        const existingVariantSku =
          await Product.findOne({
            "variants.sku":
              variant.sku,

            _id: {
              $ne:
                req.params.id,
            },
          });

        if (
          existingVariantSku
        ) {
          return res.status(400).json({
            success: false,
            message:
              `Variant SKU ${variant.sku} already exists`,
          });
        }
      }

      product.variants =
        normalizedVariants;
    }

    // ==========================================
    // DUPLICATE SLUG
    // ==========================================

    if (req.body.slug) {
      const duplicateSlug =
        await Product.findOne({
          slug:
            req.body.slug,

          _id: {
            $ne:
              req.params.id,
          },
        });

      if (duplicateSlug) {
        return res.status(400).json({
          success: false,
          message:
            "Another product already uses this slug",
        });
      }
    }

    // ==========================================
    // DUPLICATE PRODUCT SKU
    // ==========================================

    if (req.body.sku) {
      const duplicateSku =
        await Product.findOne({
          sku:
            req.body.sku,

          _id: {
            $ne:
              req.params.id,
          },
        });

      if (duplicateSku) {
        return res.status(400).json({
          success: false,
          message:
            "Another product already uses this SKU",
        });
      }
    }

    // ==========================================
    // NEW PRODUCT IMAGES
    // ==========================================

    if (req.files?.images) {
      const newImages = [];

      for (
        const file of
          req.files.images
      ) {
        const result =
          await uploadToCloudinary(
            file,
            "products"
          );

        newImages.push(
          result.secure_url
        );
      }

      product.images = [
        ...(product.images || []),
        ...newImages,
      ];
    }

    // ==========================================
    // SAVE
    // ==========================================

    await product.save();

    // ==========================================
    // POPULATE CATEGORY
    // ==========================================

    const updatedProduct =
      await Product.findById(
        product._id
      ).populate(
        "category",
        "name slug"
      );

    // ==========================================
    // RESPONSE
    // ==========================================

    res.status(200).json({
      success: true,
      message:
        "Product updated successfully",
      product: updatedProduct,
    });

  } catch (error) {
    console.error(
      "Update Product Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to update product",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE PRODUCT
// ==========================================

const deleteProduct = async (req, res) => {
  try {
    const product =
      await Product.findById(
        req.params.id
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found",
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message:
        "Product deleted successfully",
    });

  } catch (error) {
    console.error(
      "Delete Product Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to delete product",
      error: error.message,
    });
  }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  getProductBySlug,
  updateProduct,
  deleteProduct,
};