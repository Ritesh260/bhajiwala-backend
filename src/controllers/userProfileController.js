
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");

// ==========================================
// UPLOAD IMAGE TO CLOUDINARY
// ==========================================

const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "bhajiwala/users/profile",
        resource_type: "image",
        transformation: [
          {
            width: 500,
            height: 500,
            crop: "fill",
          },
          {
            quality: "auto",
            fetch_format: "auto",
          },
        ],
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
// GET CUSTOMER PROFILE
// GET /api/user/profile
// ==========================================

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -__v"
    );

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      user,
    });
  } catch (error) {
    console.error("Get Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

// ==========================================
// UPDATE CUSTOMER PROFILE
// PUT /api/user/profile
// ==========================================

exports.updateUserProfile = async (req, res) => {
  try {
    const { name, phone, email } = req.body;

    const user = await User.findById(req.user.id);

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ==========================================
    // VALIDATION
    // ==========================================

    if (
      (name !== undefined && !String(name).trim()) ||
      (phone !== undefined && !String(phone).trim()) ||
      (email !== undefined && !String(email).trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, phone and email cannot be empty",
      });
    }

    const cleanName =
      name !== undefined ? String(name).trim() : user.name;

    const cleanEmail =
      email !== undefined
        ? String(email).trim().toLowerCase()
        : user.email;

    const cleanPhone =
      phone !== undefined
        ? String(phone).trim()
        : user.phone;

    // ==========================================
    // EMAIL VALIDATION
    // ==========================================

    if (
      email !== undefined &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    // ==========================================
    // PHONE VALIDATION
    // ==========================================

    if (
      phone !== undefined &&
      !/^\d{10}$/.test(cleanPhone)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10 digit phone number",
      });
    }

    // ==========================================
    // CHECK DUPLICATE EMAIL / PHONE
    // ==========================================

    const existingUser = await User.findOne({
      _id: { $ne: user._id },
      $or: [
        { email: cleanEmail },
        { phone: cleanPhone },
      ],
    });

    if (existingUser) {
      if (existingUser.email === cleanEmail) {
        return res.status(409).json({
          success: false,
          message: "Email already registered with another account",
        });
      }

      if (existingUser.phone === cleanPhone) {
        return res.status(409).json({
          success: false,
          message: "Phone number already registered with another account",
        });
      }
    }

    // ==========================================
    // UPDATE ALLOWED FIELDS
    // ==========================================

    if (name !== undefined) user.name = cleanName;
    if (phone !== undefined) user.phone = cleanPhone;
    if (email !== undefined) user.email = cleanEmail;

    await user.save();

    const updatedUser = await User.findById(user._id).select(
      "-password -__v"
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email or phone number already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

// ==========================================
// UPLOAD / UPDATE PROFILE IMAGE
// POST /api/user/profile/image
// ==========================================

exports.uploadProfileImage = async (req, res) => {
  let uploadedPublicId = "";

  try {
    // Check selected image
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a profile image",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Upload new image
    const result = await uploadToCloudinary(req.file);

    uploadedPublicId = result.public_id;

    const oldPublicId = user.profileImagePublicId;

    // Save new image
    user.profileImage = result.secure_url;
    user.profileImagePublicId = result.public_id;

    await user.save();

    // Delete old image after successful save
    if (oldPublicId && oldPublicId !== result.public_id) {
      try {
        await cloudinary.uploader.destroy(oldPublicId);
      } catch (deleteError) {
        console.error("Old Profile Image Delete Error:", deleteError);
      }
    }

    const updatedUser = await User.findById(user._id).select(
      "-password -__v"
    );

    return res.status(200).json({
      success: true,
      message: "Profile image updated successfully",
      profileImage: result.secure_url,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Upload Profile Image Error:", error);

    // Cleanup new image if database save fails
    if (uploadedPublicId) {
      try {
        await cloudinary.uploader.destroy(uploadedPublicId);
      } catch (deleteError) {
        console.error("Image Cleanup Error:", deleteError);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update profile image",
    });
  }
};
