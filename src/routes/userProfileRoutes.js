const express = require("express");
const router = express.Router();

const protect = require("../middleware/authUserMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
} = require("../controllers/userProfileController");

router.use(protect);

router.get("/", getUserProfile);
router.put("/", updateUserProfile);

router.post(
  "/image",
  upload.single("profileImage"),
  uploadProfileImage
);

module.exports = router;