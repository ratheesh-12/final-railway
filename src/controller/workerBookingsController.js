// Packages
const bcrypt = require("bcrypt");

// Import from the Database folder
const db = require("../config/db.js");

// Create New Booking (Page 1 - Add New Booking)
const createBooking = async (req, res) => {
  const {
    booking_id, // Booking ID from frontend (not auto-generated)
    admin_id,
    worker_id,
    guest_name,
    phone_number,
    number_of_persons,
    booking_type,
    total_hours, // Total hours provided by user
    booking_date,
    in_time, // Only in_time is collected, out_time is calculated
    proof_type,
    proof_id,
    price_per_person,
    paid_amount,
    payment_method,
  } = req.body;

  // Validation (out_time is NOT required - it will be calculated)
  if (
    !booking_id ||
    !admin_id ||
    !worker_id ||
    !guest_name ||
    !phone_number ||
    !number_of_persons ||
    !booking_type ||
    !total_hours ||
    !booking_date ||
    !in_time ||
    !proof_type ||
    !proof_id ||
    !price_per_person
  ) {
    return res.status(400).json({
      message: "All required booking fields must be provided",
    });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // Check if booking_id already exists
    const checkBookingIdQuery = `SELECT * FROM bookings WHERE booking_id = $1;`;
    const { rows: existingBooking } = await client.query(checkBookingIdQuery, [
      booking_id,
    ]);

    if (existingBooking.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "Booking ID already exists. Please use a different ID.",
      });
    }

    // Check if admin exists
    const checkAdminQuery = `SELECT * FROM admin_accounts WHERE admin_id = $1;`;
    const { rows: adminExists } = await client.query(checkAdminQuery, [
      admin_id,
    ]);

    if (adminExists.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Admin not found" });
    }

    // Check if worker exists
    const checkWorkerQuery = `SELECT * FROM worker_accounts WHERE worker_id = $1;`;
    const { rows: workerExists } = await client.query(checkWorkerQuery, [
      worker_id,
    ]);

    if (workerExists.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Worker not found" });
    }

    // Calculate out_time based on in_time and total_hours
    const inTimeParts = in_time.split(":");
    const inHours = parseInt(inTimeParts[0]);
    const inMinutes = parseInt(inTimeParts[1] || 0);
    
    // Add total_hours to in_time
    let outHours = inHours + parseInt(total_hours);
    let outMinutes = inMinutes;
    
    // Handle overflow (more than 24 hours)
    if (outHours >= 24) {
      outHours = outHours % 24;
    }
    
    // Format out_time as HH:MM
    const out_time = `${String(outHours).padStart(2, '0')}:${String(outMinutes).padStart(2, '0')}`;

    // Calculate total amount (price_per_person * number_of_persons * total_hours)
    const total_amount = price_per_person * number_of_persons * total_hours;

    // Insert new booking with booking_id from frontend
    const insertQuery = `
      INSERT INTO bookings (
        booking_id, admin_id, worker_id, guest_name, phone_number, 
        number_of_persons, booking_type, total_hours, booking_date, 
        in_time, out_time, proof_type, proof_id, price_per_person, 
        total_amount, paid_amount, payment_method, booking_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING 
        booking_id, admin_id, worker_id, guest_name, phone_number, 
        number_of_persons, booking_type, total_hours, booking_date, 
        in_time, out_time, proof_type, proof_id, price_per_person, 
        total_amount, paid_amount, balance_amount, payment_method, 
        booking_status, created_at, updated_at;
    `;

    const values = [
      booking_id, // From frontend
      admin_id,
      worker_id,
      guest_name,
      phone_number,
      number_of_persons,
      booking_type,
      total_hours,
      booking_date,
      in_time,
      out_time,
      proof_type,
      proof_id,
      price_per_person,
      total_amount,
      paid_amount || 0,
      payment_method || "cash",
      "active", // Default status is active when creating new booking
    ];

    const { rows } = await client.query(insertQuery, values);

    await client.query("COMMIT");

    res.status(201).json({
      message: "Booking created successfully",
      booking: rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error creating booking:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

// Get Booking Details by ID (for bill and booking details display)
const getBookingById = async (req, res) => {
  const { id } = req.params;

  if (!id || id.trim() === "") {
    return res.status(400).json({ message: "Booking ID is required" });
  }

  const client = await db.connect();
  try {
    const query = `
      SELECT 
        b.booking_id,
        b.admin_id,
        b.worker_id,
        b.guest_name,
        b.phone_number,
        b.number_of_persons,
        b.booking_type,
        b.total_hours,
        b.booking_date,
        b.in_time,
        b.out_time,
        b.proof_type,
        b.proof_id,
        b.price_per_person,
        b.total_amount,
        b.paid_amount,
        b.balance_amount,
        b.payment_method,
        b.booking_status,
        b.created_at,
        b.updated_at,
        a.full_name as admin_name,
        w.full_name as worker_name
      FROM bookings b
      LEFT JOIN admin_accounts a ON b.admin_id = a.admin_id
      LEFT JOIN worker_accounts w ON b.worker_id = w.worker_id
      WHERE b.booking_id = $1;
    `;

    const { rows } = await client.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({
      message: "Booking details retrieved successfully",
      booking: rows[0],
    });
  } catch (err) {
    console.error("Error retrieving booking:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

// Get All Bookings (with filters for active/completed)
const getAllBookings = async (req, res) => {
  const { status, admin_id, worker_id, booking_date } = req.query;

  const client = await db.connect();
  try {
    let query = `
      SELECT 
        b.booking_id,
        b.admin_id,
        b.worker_id,
        b.guest_name,
        b.phone_number,
        b.number_of_persons,
        b.booking_type,
        b.total_hours,
        b.booking_date,
        b.in_time,
        b.out_time,
        b.proof_type,
        b.proof_id,
        b.price_per_person,
        b.total_amount,
        b.paid_amount,
        b.balance_amount,
        b.payment_method,
        b.booking_status,
        b.created_at,
        b.updated_at,
        a.full_name as admin_name,
        w.full_name as worker_name
      FROM bookings b
      LEFT JOIN admin_accounts a ON b.admin_id = a.admin_id
      LEFT JOIN worker_accounts w ON b.worker_id = w.worker_id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    // Add filters dynamically
    if (status) {
      query += ` AND b.booking_status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (admin_id) {
      query += ` AND b.admin_id = $${paramCount}`;
      params.push(admin_id);
      paramCount++;
    }

    if (worker_id) {
      query += ` AND b.worker_id = $${paramCount}`;
      params.push(worker_id);
      paramCount++;
    }

    if (booking_date) {
      query += ` AND b.booking_date = $${paramCount}`;
      params.push(booking_date);
      paramCount++;
    }

    query += ` ORDER BY b.created_at DESC;`;

    const { rows } = await client.query(query, params);

    res.status(200).json({
      message: "Bookings retrieved successfully",
      count: rows.length,
      bookings: rows,
    });
  } catch (err) {
    console.error("Error retrieving bookings:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

// Submit Booking - Update booking with actual checkout time and calculate final amount (Page 2 - Submit Booking)
const submitBooking = async (req, res) => {
  const { id } = req.params;
  const {
    guest_name,
    phone_number,
    number_of_persons,
    booking_type,
    booking_date,
    in_time,
    out_time, // Actual checkout time (may be different from planned)
    proof_type,
    proof_id,
    price_per_person,
    paid_amount,
    payment_method,
  } = req.body;

  if (!id || id.trim() === "") {
    return res.status(400).json({ message: "Booking ID is required" });
  }

  // Validation - all fields required for submit booking
  if (
    !guest_name ||
    !phone_number ||
    !number_of_persons ||
    !booking_type ||
    !booking_date ||
    !in_time ||
    !out_time ||
    !proof_type ||
    !proof_id ||
    !price_per_person ||
    paid_amount === undefined ||
    paid_amount === null
  ) {
    return res.status(400).json({
      message: "All fields are required to submit booking",
    });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // Check if booking exists
    const checkQuery = `SELECT * FROM bookings WHERE booking_id = $1;`;
    const { rows: existingBooking } = await client.query(checkQuery, [id]);

    if (existingBooking.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if already completed
    if (existingBooking[0].booking_status === "completed") {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Booking is already completed" });
    }

    // Calculate actual total hours based on in_time and out_time
    const inTimeParts = in_time.split(":");
    const outTimeParts = out_time.split(":");
    
    const inMinutes = parseInt(inTimeParts[0]) * 60 + parseInt(inTimeParts[1]);
    const outMinutes = parseInt(outTimeParts[0]) * 60 + parseInt(outTimeParts[1]);
    
    let totalMinutes = outMinutes - inMinutes;
    
    // Handle case where checkout is next day
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60; // Add 24 hours
    }
    
    // Convert to hours (round up for any partial hour)
    const actual_total_hours = Math.ceil(totalMinutes / 60);

    // Calculate total amount based on actual hours
    const total_amount = price_per_person * number_of_persons * actual_total_hours;

    // Validate paid amount doesn't exceed total amount
    if (paid_amount > total_amount) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Paid amount cannot exceed total amount",
      });
    }

    // Update booking with all details and mark as completed
    const updateQuery = `
      UPDATE bookings
      SET guest_name = $1,
          phone_number = $2,
          number_of_persons = $3,
          booking_type = $4,
          total_hours = $5,
          booking_date = $6,
          in_time = $7,
          out_time = $8,
          proof_type = $9,
          proof_id = $10,
          price_per_person = $11,
          total_amount = $12,
          paid_amount = $13,
          payment_method = $14,
          booking_status = 'completed',
          updated_at = CURRENT_TIMESTAMP
      WHERE booking_id = $15
      RETURNING 
        booking_id, admin_id, worker_id, guest_name, phone_number, 
        number_of_persons, booking_type, total_hours, booking_date, 
        in_time, out_time, proof_type, proof_id, price_per_person, 
        total_amount, paid_amount, balance_amount, payment_method, 
        booking_status, created_at, updated_at;
    `;

    const values = [
      guest_name,
      phone_number,
      number_of_persons,
      booking_type,
      actual_total_hours, // Calculated based on actual in/out time
      booking_date,
      in_time,
      out_time,
      proof_type,
      proof_id,
      price_per_person,
      total_amount, // Calculated: price_per_person × number_of_persons × actual_total_hours
      paid_amount,
      payment_method || "cash",
      id,
    ];

    const { rows } = await client.query(updateQuery, values);

    await client.query("COMMIT");

    res.status(200).json({
      message: "Booking submitted and completed successfully",
      booking: rows[0],
      calculated: {
        actual_hours: actual_total_hours,
        calculated_amount: total_amount,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error submitting booking:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

// Update Booking Payment (Update paid amount during booking)
const updateBookingPayment = async (req, res) => {
  const { id } = req.params;
  const { paid_amount, payment_method } = req.body;

  if (!id || id.trim() === "") {
    return res.status(400).json({ message: "Booking ID is required" });
  }

  if (paid_amount === undefined || paid_amount === null) {
    return res.status(400).json({ message: "Paid amount is required" });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // Check if booking exists
    const checkQuery = `SELECT * FROM bookings WHERE booking_id = $1;`;
    const { rows: existingBooking } = await client.query(checkQuery, [id]);

    if (existingBooking.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Booking not found" });
    }

    // Validate paid amount doesn't exceed total amount
    if (paid_amount > existingBooking[0].total_amount) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Paid amount cannot exceed total amount",
      });
    }

    // Update payment
    const updateQuery = `
      UPDATE bookings
      SET paid_amount = $1,
          payment_method = COALESCE($2, payment_method),
          updated_at = CURRENT_TIMESTAMP
      WHERE booking_id = $3
      RETURNING 
        booking_id, admin_id, worker_id, guest_name, phone_number, 
        number_of_persons, booking_type, total_hours, booking_date, 
        in_time, out_time, proof_type, proof_id, price_per_person, 
        total_amount, paid_amount, balance_amount, payment_method, 
        booking_status, created_at, updated_at;
    `;

    const values = [paid_amount, payment_method, id];

    const { rows } = await client.query(updateQuery, values);

    await client.query("COMMIT");

    res.status(200).json({
      message: "Payment updated successfully",
      booking: rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error updating payment:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

// Delete Booking (Cancel booking)
const deleteBooking = async (req, res) => {
  const { id } = req.params;

  if (!id || id.trim() === "") {
    return res.status(400).json({ message: "Booking ID is required" });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // Delete booking
    const deleteQuery = `
      DELETE FROM bookings 
      WHERE booking_id = $1
      RETURNING booking_id, guest_name, booking_status;
    `;
    const { rows: deletedBooking } = await client.query(deleteQuery, [id]);

    if (deletedBooking.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Booking not found" });
    }

    await client.query("COMMIT");

    res.status(200).json({
      message: "Booking deleted successfully",
      deletedBooking: deletedBooking[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error deleting booking:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

module.exports = {
  createBooking,
  getBookingById,
  getAllBookings,
  submitBooking,
  updateBookingPayment,
  deleteBooking,
};
