const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const adminRoutes = require("./routes/adminRoutes.js");
const workerRoutes = require("./routes/workerRoutes.js");
// const bookingsRoutes = require("./routes/bookingsRoutes.js");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("trust proxy", 1);

app.use("/api/admin", adminRoutes);
app.use("/api/worker", workerRoutes);
// app.use("/api/bookings", bookingsRoutes);

module.exports = app;
