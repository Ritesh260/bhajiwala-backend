const Category = require("../models/Category");
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
// CREATE CATEGORY
// ==========================================

const createCategory = async (req, res) => {
  try {

    const {
      name,
      slug,
      parent,
      shortDescription,
      description,
      featured,
      status,
      seoTitle,
      seoDescription,
    } = req.body;


    // Required fields

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: "Category name and slug are required",
      });
    }


    // Check duplicate slug

    const existingCategory = await Category.findOne({
      slug,
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category with this slug already exists",
      });
    }


    // ===============================
    // IMAGE UPLOAD
    // ===============================

    let imageUrl = "";
    let bannerUrl = "";


    if (req.files?.image?.[0]) {

      const imageResult = await uploadToCloudinary(
        req.files.image[0],
        "categories"
      );

      imageUrl = imageResult.secure_url;
    }


    // ===============================
    // BANNER UPLOAD
    // ===============================

    if (req.files?.banner?.[0]) {

      const bannerResult = await uploadToCloudinary(
        req.files.banner[0],
        "category-banners"
      );

      bannerUrl = bannerResult.secure_url;
    }


    // ===============================
    // CREATE CATEGORY
    // ===============================

    const category = await Category.create({

      name,

      slug,

      parent: parent || null,

      shortDescription,

      description,

      image: imageUrl,

      banner: bannerUrl,

      featured:
        featured === true ||
        featured === "true",

      status,

      seoTitle,

      seoDescription,

    });


    res.status(201).json({

      success: true,

      message: "Category created successfully",

      category,

    });


  } catch (error) {

    console.error(
      "Create Category Error:",
      error
    );


    res.status(500).json({

      success: false,

      message: "Failed to create category",

      error: error.message,

    });

  }
};


// ==========================================
// GET ALL CATEGORIES
// ==========================================

const getCategories = async (req, res) => {

  try {

    const categories = await Category.find()
      .populate("parent", "name slug")
      .sort({ createdAt: -1 });


    res.status(200).json({

      success: true,

      count: categories.length,

      categories,

    });


  } catch (error) {

    console.error(
      "Get Categories Error:",
      error
    );


    res.status(500).json({

      success: false,

      message: "Failed to fetch categories",

      error: error.message,

    });

  }

};


// ==========================================
// GET SINGLE CATEGORY
// ==========================================

const getCategory = async (req, res) => {

  try {

    const category = await Category.findById(
      req.params.id
    ).populate(
      "parent",
      "name slug"
    );


    if (!category) {

      return res.status(404).json({

        success: false,

        message: "Category not found",

      });

    }


    res.status(200).json({

      success: true,

      category,

    });


  } catch (error) {

    console.error(
      "Get Category Error:",
      error
    );


    res.status(500).json({

      success: false,

      message: "Failed to fetch category",

      error: error.message,

    });

  }

};


// ==========================================
// UPDATE CATEGORY
// ==========================================

const updateCategory = async (req, res) => {

  try {

    const category = await Category.findById(
      req.params.id
    );


    if (!category) {

      return res.status(404).json({

        success: false,

        message: "Category not found",

      });

    }


    // ===============================
    // UPDATE BASIC FIELDS
    // ===============================

    const fields = [

      "name",
      "slug",
      "parent",
      "shortDescription",
      "description",
      "featured",
      "status",
      "seoTitle",
      "seoDescription",

    ];


    fields.forEach((field) => {

      if (req.body[field] !== undefined) {

        category[field] = req.body[field];

      }

    });


    // ===============================
    // CHECK DUPLICATE SLUG
    // ===============================

    if (req.body.slug) {

      const duplicate =
        await Category.findOne({

          slug: req.body.slug,

          _id: {
            $ne: req.params.id,
          },

        });


      if (duplicate) {

        return res.status(400).json({

          success: false,

          message:
            "Another category already uses this slug",

        });

      }

    }


    // ===============================
    // NEW CATEGORY IMAGE
    // ===============================

    if (req.files?.image?.[0]) {

      const imageResult =
        await uploadToCloudinary(
          req.files.image[0],
          "categories"
        );


      category.image =
        imageResult.secure_url;

    }


    // ===============================
    // NEW BANNER IMAGE
    // ===============================

    if (req.files?.banner?.[0]) {

      const bannerResult =
        await uploadToCloudinary(
          req.files.banner[0],
          "category-banners"
        );


      category.banner =
        bannerResult.secure_url;

    }


    await category.save();


    res.status(200).json({

      success: true,

      message:
        "Category updated successfully",

      category,

    });


  } catch (error) {

    console.error(
      "Update Category Error:",
      error
    );


    res.status(500).json({

      success: false,

      message:
        "Failed to update category",

      error: error.message,

    });

  }

};


// ==========================================
// DELETE CATEGORY
// ==========================================

const deleteCategory = async (req, res) => {

  try {

    const category =
      await Category.findById(
        req.params.id
      );


    if (!category) {

      return res.status(404).json({

        success: false,

        message: "Category not found",

      });

    }


    await category.deleteOne();


    res.status(200).json({

      success: true,

      message:
        "Category deleted successfully",

    });


  } catch (error) {

    console.error(
      "Delete Category Error:",
      error
    );


    res.status(500).json({

      success: false,

      message:
        "Failed to delete category",

      error: error.message,

    });

  }

};


module.exports = {

  createCategory,

  getCategories,

  getCategory,

  updateCategory,

  deleteCategory,

};