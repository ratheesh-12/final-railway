const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const adminRoutes = require("./routes/adminRoutes.js");
const workerRoutes = require("./routes/workerRoutes.js");
const workerBookingsRoutes = require("./routes/workerBookingsRoutes.js");
const bookingRoutes = require("./routes/bookingRoutes.js");

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:8080", "http://localhost:8081", "http://localhost:3000"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("trust proxy", 1);

app.use("/api/admin", adminRoutes);
app.use("/api/worker", workerRoutes);
app.use("/api/bookings", workerBookingsRoutes);
app.use("/api/analytics", bookingRoutes);

module.exports = app;
