const express = require("express");
const router = express.Router();


const upload = require("../middleware/uploadMiddleware");

const {
  createCombo,
  getAllCombos,
  getComboById,
  updateCombo,
  deleteCombo,
} = require("../controllers/comboController");

// CREATE
router.post("/", upload.single("image"), createCombo);

// GET ALL
router.get("/", getAllCombos);

// GET SINGLE
router.get("/:id", getComboById);

// UPDATE
router.put("/:id", upload.single("image"), updateCombo);

// DELETE
router.delete("/:id", deleteCombo);

module.exports = router;