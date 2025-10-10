// Imports from the packages
const express = require("express");

// Imports from the folder Controller
const {
  getDashboardStats,
  getMonthlyRevenue,
  getDailyRevenue,
  getTopWorkers,
  getRecentBookings,
  getPaymentAnalytics,
} = require("../controller/bookingController");

// Imports from the folder Middleware for the authentication (if you have one)
// const { authMiddleware } = require("../middleware/auth.middleware");

// Routes
const router = express.Router();

// ==================== DASHBOARD ANALYTICS ROUTES ====================

// Get Dashboard Overview Statistics
// Returns: total revenue, bookings, completed bookings, top category, active bookings
router.get("/dashboard/stats", getDashboardStats);

// Get Monthly Revenue Chart Data (for the last 6 months or custom range)
// Query params: ?year=2025&months=6
router.get("/dashboard/monthly-revenue", getMonthlyRevenue);

// Get Daily Revenue for Current/Specific Month
// Query params: ?month=10&year=2025
router.get("/dashboard/daily-revenue", getDailyRevenue);

// Get Top Performing Workers
// Query params: ?limit=10&month=10&year=2025
router.get("/dashboard/top-workers", getTopWorkers);

// Get Recent Bookings for Dashboard Display
// Query params: ?limit=10&status=active
router.get("/dashboard/recent-bookings", getRecentBookings);

// Get Payment Analytics
// Query params: ?month=10&year=2025
router.get("/dashboard/payment-analytics", getPaymentAnalytics);

module.exports = router;
