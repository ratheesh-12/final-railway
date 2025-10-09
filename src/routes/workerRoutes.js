// Imports from the packages
const express = require("express");

// Imports from the folder Controller
const {
  createWorker,
  getAllWorkers,
  getWorkerById,
  getWorkersByAdminId,
  updateWorker,
  updateWorkerPassword,
  deleteWorker,
  workerLogin,
} = require("../controller/workerController");

// Imports from the folder Middleware for the authentication (if you have one)
// const { authMiddleware } = require("../middleware/auth.middleware");

// Routes
const router = express.Router();

// ==================== POST Routes ====================

// Worker Login
router.post("/login", workerLogin);

// Create Worker Account
router.post("/create-worker", createWorker);

// ==================== GET Routes ====================

// Get All Workers
router.get("/get-all-workers", getAllWorkers);

// Get Worker by ID
router.get("/get-worker/:id", getWorkerById);

// Get Workers by Admin ID
router.get("/get-workers-by-admin/:admin_id", getWorkersByAdminId);

// ==================== PUT Routes ====================

// Update Worker Details
router.put("/update-worker/:id", updateWorker);

// Update Worker Password
router.put("/update-password/:id", updateWorkerPassword);

// ==================== DELETE Routes ====================

// Delete Worker Account
router.delete("/delete-worker/:id", deleteWorker);

module.exports = router;
