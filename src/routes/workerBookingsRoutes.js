// Imports from the packages
const express = require("express");

// Imports from the folder Controller
const {
  createBooking,
  getBookingById,
  getAllBookings,
  submitBooking,
  updateBookingPayment,
  deleteBooking,
} = require("../controller/WorkerBookingsController");

// Imports from the folder Middleware for the authentication (if you have one)
// const { authMiddleware } = require("../middleware/auth.middleware");

// Routes
const router = express.Router();

// ==================== POST Routes ====================

// Create New Booking (Page 1 - Add New Booking)
router.post("/create-booking", createBooking);

// ==================== GET Routes ====================

// Get All Bookings (with optional filters: status, admin_id, worker_id, booking_date)
router.get("/get-all-bookings", getAllBookings);

// Get Booking by ID (for bill and booking details display)
router.get("/get-booking/:id", getBookingById);

// ==================== PUT Routes ====================

// Submit Booking - Complete booking with actual checkout time (Page 2 - Submit Booking)
router.put("/submit-booking/:id", submitBooking);

// Update Booking Payment - Update paid amount during booking
router.put("/update-payment/:id", updateBookingPayment);

// ==================== DELETE Routes ====================

// Delete Booking (Cancel booking)
router.delete("/delete-booking/:id", deleteBooking);

module.exports = router;
