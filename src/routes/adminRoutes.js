// Imports from the packages
const express = require("express");

// Imports from the folder Controller
const {
  createAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  updateAdminPassword,
  deleteAdmin,
  adminLogin,
} = require("../controller/adminController");

// Imports from the folder Middleware for the authentication (if you have one)
// const { authMiddleware } = require("../middleware/auth.middleware");

// Routes
const router = express.Router();

// ==================== POST Routes ====================

// Admin Login
router.post("/login", adminLogin);

// Create Admin Account
router.post("/register", createAdmin);

// ==================== GET Routes ====================

// Get All Admins
router.get("/get-all-admins", getAllAdmins);

// Get Admin by ID
router.get("/get-admin/:id", getAdminById);

// ==================== PUT Routes ====================

// Update Admin Details
router.put("/update-admin/:id", updateAdmin);

// Update Admin Password
router.put("/update-password/:id", updateAdminPassword);

// ==================== DELETE Routes ====================

// Delete Admin Account
router.delete("/delete-admin/:id", deleteAdmin);

module.exports = router;
