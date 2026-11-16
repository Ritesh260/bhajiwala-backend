
const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getMe,
} = require("../controllers/authUserController");

const protect = require("../middleware/authUserMiddleware");

// Signup
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Logged In User Profile
router.get("/me", protect, getMe);

module.exports = router;
