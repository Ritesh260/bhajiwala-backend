const dns = require("dns");

dns.setServers([
  "8.8.8.8",
  "1.1.1.1",
]);

const dotenv = require("dotenv");

// Load environment variables FIRST
dotenv.config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const cartRoutes = require("./routes/cartRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const offerRoutes = require("./routes/offerRoutes");
const couponRoutes = require("./routes/couponRoutes");
const comboRoutes = require("./routes/comboRoutes");
const seasonalOfferRoutes = require("./routes/seasonalOfferRoutes");

const userProfileRoutes = require("./routes/userProfileRoutes");
const addressRoutes = require("./routes/addressRoutes");
const deliverySettingsRoutes = require("./routes/deliverySettingsRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
const orderRoutes = require("./routes/orderRoutes");
const deliveryPartnerRoutes = require("./routes/deliveryPartnerRoutes");
const adminDeliveryPartnerRoutes = require("./routes/adminDeliveryPartnerRoutes");
const app = express();


// ==========================================
// DATABASE
// ==========================================

connectDB();


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());

app.use(express.json());


// ==========================================
// ROUTES
// ==========================================

app.use("/api/auth", authRoutes);
app.use("/api/user/auth", require("./routes/authUserRoutes"));
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/offers/combos", comboRoutes);
app.use("/api/offers/seasonal", seasonalOfferRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/user/cart", cartRoutes);
app.use("/api/user/wishlist", wishlistRoutes);

app.use("/api/user/profile", userProfileRoutes);
app.use("/api/user/addresses", addressRoutes);
app.use("/api/delivery-settings", deliverySettingsRoutes);
app.use("/api/user/checkout", checkoutRoutes);
app.use("/api/user/orders", orderRoutes);
app.use("/api/delivery-partners", deliveryPartnerRoutes);
app.use("/api/admin/delivery-partners", adminDeliveryPartnerRoutes);
// ==========================================
// HOME
// ==========================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "BhajiWala Backend API is running",
  });
});


// ==========================================
// SERVER
// ==========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});