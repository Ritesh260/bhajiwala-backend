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
      featured,
      status,
      seoTitle,
      seoDescription,
    } = req.body;

    // Required fields

    if (!name || !slug || !category || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, slug, category and price are required",
      });
    }

    // Duplicate slug

    const existingSlug = await Product.findOne({ slug });

    if (existingSlug) {
      return res.status(400).json({
        success: false,
        message: "Product with this slug already exists",
      });
    }

    // Duplicate SKU

    if (sku) {
      const existingSku = await Product.findOne({ sku });

      if (existingSku) {
        return res.status(400).json({
          success: false,
          message: "Product with this SKU already exists",
        });
      }
    }

    // ==========================================
    // PRODUCT IMAGE UPLOAD
    // ==========================================

    const imageUrls = [];

    if (req.files?.images) {
      for (const file of req.files.images) {
        const result = await uploadToCloudinary(
          file,
          "products"
        );

        imageUrls.push(result.secure_url);
      }
    }

    // ==========================================
    // CREATE PRODUCT
    // ==========================================

    const product = await Product.create({
      name,
      slug,
      category,
      brand,
      shortDescription,
      description,

      price: Number(price),

      discountPrice:
        discountPrice !== undefined && discountPrice !== ""
          ? Number(discountPrice)
          : 0,

      costPrice:
        costPrice !== undefined && costPrice !== ""
          ? Number(costPrice)
          : 0,

      sku,

      stock:
        stock !== undefined && stock !== ""
          ? Number(stock)
          : 0,

      unit,

      images: imageUrls,

      featured:
        featured === true ||
        featured === "true",

      status,

      seoTitle,
      seoDescription,
    });

    const populatedProduct =
      await Product.findById(product._id)
        .populate("category", "name slug");

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: populatedProduct,
    });

  } catch (error) {
    console.error(
      "Create Product Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message,
    });
  }
};

// ==========================================
// GET ALL PRODUCTS
// ==========================================

const getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("category", "name slug")
      .sort({ createdAt: -1 });

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
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

// ==========================================
// GET SINGLE PRODUCT
// ==========================================

const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(
      req.params.id
    ).populate(
      "category",
      "name slug"
    );

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
    console.error(
      "Get Product Error:",
      error
    );

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
    const product = await Product.findById(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
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
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    // ==========================================
    // DUPLICATE SLUG
    // ==========================================

    if (req.body.slug) {
      const duplicateSlug =
        await Product.findOne({
          slug: req.body.slug,
          _id: {
            $ne: req.params.id,
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
    // DUPLICATE SKU
    // ==========================================

    if (req.body.sku) {
      const duplicateSku =
        await Product.findOne({
          sku: req.body.sku,
          _id: {
            $ne: req.params.id,
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

      for (const file of req.files.images) {
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
        ...product.images,
        ...newImages,
      ];
    }

    await product.save();

    const updatedProduct =
      await Product.findById(
        product._id
      ).populate(
        "category",
        "name slug"
      );

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
        message: "Product not found",
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

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
};