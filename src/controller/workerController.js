// Packages
const bcrypt = require("bcrypt");

// Import from the Database folder
const db = require("../config/db.js");

// Create Worker Account
const createWorker = async (req, res) => {
  const {
    admin_id,
    full_name,
    mobile_number,
    joining_date,
    gender,
    user_name,
    password,
  } = req.body;

  // Validation
  if (
    !admin_id ||
    !full_name ||
    !mobile_number ||
    !joining_date ||
    !user_name ||
    !password
  ) {
    return res.status(400).json({
      message:
        "Admin ID, full name, mobile number, joining date, username, and password are required",
    });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // Check if admin exists
    const checkAdminQuery = `SELECT * FROM admin_accounts WHERE admin_id = $1;`;
    const { rows: adminExists } = await client.query(checkAdminQuery, [
      admin_id,
    ]);

    if (adminExists.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Admin not found" });
    }

    // Check if worker already exists with mobile number or username
    const checkQuery = `
      SELECT * FROM worker_accounts 
      WHERE mobile_number = $1 OR user_name = $2;
    `;
    const { rows: existingWorkers } = await client.query(checkQuery, [
      mobile_number,
      user_name,
    ]);

    if (existingWorkers.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "Worker with this mobile number or username already exists",
      });
    }

    // Generate new worker_id (WOR001, WOR002, etc.)
    const getLastIdQuery = `
      SELECT worker_id FROM worker_accounts 
      ORDER BY worker_id DESC 
      LIMIT 1;
    `;
    const { rows: lastWorker } = await client.query(getLastIdQuery);

    let newWorkerId;
    if (lastWorker.length === 0) {
      // First worker
      newWorkerId = "WOR001";
    } else {
      // Extract number from last worker_id and increment
      const lastId = lastWorker[0].worker_id;
      const lastNumber = parseInt(lastId.replace("WOR", ""));
      const newNumber = lastNumber + 1;
      newWorkerId = `WOR${String(newNumber).padStart(3, "0")}`;
    }

    // Hash the password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert new worker with auto-generated ID
    const insertQuery = `
      INSERT INTO worker_accounts (
        worker_id, admin_id, full_name, mobile_number, joining_date, gender, user_name, password_hash
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING worker_id, admin_id, full_name, mobile_number, joining_date, gender, user_name, created_at, updated_at;
    `;

    const values = [
      newWorkerId,
      admin_id,
      full_name,
      mobile_number,
      joining_date,
      gender || null,
      user_name,
      password_hash,
    ];

    const { rows } = await client.query(insertQuery, values);

    await client.query("COMMIT");

    res.status(201).json({
      message: "Worker account created successfully",
      worker: rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error creating worker account:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

// Get All Workers
const getAllWorkers = async (req, res) => {
  const client = await db.connect();
  try {
    const query = `
      SELECT 
        w.worker_id, 
        w.admin_id, 
        w.full_name, 
        w.mobile_number, 
        w.joining_date, 
        w.gender, 
        w.user_name, 
        w.created_at, 
        w.updated_at,
        a.full_name as admin_name
      FROM worker_accounts w
      LEFT JOIN admin_accounts a ON w.admin_id = a.admin_id
      ORDER BY w.created_at DESC;
    `;

    const { rows } = await client.query(query);

    res.status(200).json({
      message: "Workers retrieved successfully",
      count: rows.length,
      workers: rows,
    });
  } catch (err) {
    console.error("Error retrieving workers:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

// Get Worker by ID
const getWorkerById = async (req, res) => {
  const { id } = req.params;

  if (!id || id.trim() === "") {
    return res.status(400).json({ message: "Worker ID is required" });
  }

  const client = await db.connect();
  try {
    const query = `
      SELECT 
        w.worker_id, 
        w.admin_id, 
        w.full_name, 
        w.mobile_number, 
        w.joining_date, 
        w.gender, 
        w.user_name, 
        w.created_at, 
        w.updated_at,
        a.full_name as admin_name
      FROM worker_accounts w
      LEFT JOIN admin_accounts a ON w.admin_id = a.admin_id
      WHERE w.worker_id = $1;
    `;

    const { rows } = await client.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Worker not found" });
    }

    res.status(200).json({
      message: "Worker retrieved successfully",
      worker: rows[0],
    });
  } catch (err) {
    console.error("Error retrieving worker:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

// Get Workers by Admin ID
const getWorkersByAdminId = async (req, res) => {
  const { admin_id } = req.params;

  if (!admin_id || admin_id.trim() === "") {
    return res.status(400).json({ message: "Admin ID is required" });
  }

  const client = await db.connect();
  try {
    const query = `
      SELECT 
        worker_id, 
        admin_id, 
        full_name, 
        mobile_number, 
        joining_date, 
        gender, 
        user_name, 
        created_at, 
        updated_at
      FROM worker_accounts
      WHERE admin_id = $1
      ORDER BY created_at DESC;
    `;

    const { rows } = await client.query(query, [admin_id]);

    res.status(200).json({
      message: "Workers retrieved successfully",
      count: rows.length,
      workers: rows,
    });
  } catch (err) {
    console.error("Error retrieving workers by admin:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

// Update Worker Details
const updateWorker = async (req, res) => {
  const { id } = req.params;
  const { full_name, mobile_number, joining_date, gender, user_name } =
    req.body;

  if (!id || id.trim() === "") {
    return res.status(400).json({ message: "Worker ID is required" });
  }

  // Check if at least one field is provided for update
  if (!full_name && !mobile_number && !joining_date && !gender && !user_name) {
    return res.status(400).json({
      message: "At least one field must be provided for update",
    });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // Check if worker exists
    const checkQuery = `SELECT * FROM worker_accounts WHERE worker_id = $1;`;
    const { rows: existingWorker } = await client.query(checkQuery, [id]);

    if (existingWorker.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Worker not found" });
    }

    // Check for duplicate mobile number or username (excluding current worker)
    if (mobile_number || user_name) {
      const duplicateQuery = `
        SELECT * FROM worker_accounts 
        WHERE (mobile_number = $1 OR user_name = $2) AND worker_id != $3;
      `;
      const { rows: duplicates } = await client.query(duplicateQuery, [
        mobile_number || "",
        user_name || "",
        id,
      ]);

      if (duplicates.length > 0) {
        await client.query("ROLLBACK");
        return res.status(409).json({
          message:
            "Mobile number or username already in use by another worker",
        });
      }
    }

    // Update worker
    const updateQuery = `
      UPDATE worker_accounts
      SET full_name = COALESCE($1, full_name),
          mobile_number = COALESCE($2, mobile_number),
          joining_date = COALESCE($3, joining_date),
          gender = COALESCE($4, gender),
          user_name = COALESCE($5, user_name),
          updated_at = CURRENT_TIMESTAMP
      WHERE worker_id = $6
      RETURNING worker_id, admin_id, full_name, mobile_number, joining_date, gender, user_name, created_at, updated_at;
    `;

    const values = [
      full_name,
      mobile_number,
      joining_date,
      gender,
      user_name,
      id,
    ];

    const { rows } = await client.query(updateQuery, values);

    await client.query("COMMIT");

    res.status(200).json({
      message: "Worker details updated successfully",
      worker: rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error updating worker:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

// Update Worker Password
const updateWorkerPassword = async (req, res) => {
  const { id } = req.params;
  const { current_password, new_password } = req.body;

  if (!id || id.trim() === "") {
    return res.status(400).json({ message: "Worker ID is required" });
  }

  if (!current_password || !new_password) {
    return res.status(400).json({
      message: "Current password and new password are required",
    });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // Get worker with password hash
    const getWorkerQuery = `
      SELECT * FROM worker_accounts WHERE worker_id = $1;
    `;
    const { rows } = await client.query(getWorkerQuery, [id]);

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Worker not found" });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      current_password,
      rows[0].password_hash
    );

    if (!isPasswordValid) {
      await client.query("ROLLBACK");
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const saltRounds = 10;
    const new_password_hash = await bcrypt.hash(new_password, saltRounds);

    // Update password
    const updateQuery = `
      UPDATE worker_accounts
      SET password_hash = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE worker_id = $2
      RETURNING worker_id, full_name, user_name;
    `;

    const { rows: updatedRows } = await client.query(updateQuery, [
      new_password_hash,
      id,
    ]);

    await client.query("COMMIT");

    res.status(200).json({
      message: "Password updated successfully",
      worker: updatedRows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error updating password:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

// Delete Worker Account
const deleteWorker = async (req, res) => {
  const { id } = req.params;

  if (!id || id.trim() === "") {
    return res.status(400).json({ message: "Worker ID is required" });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // Check if worker exists and has related data
    const checkRelatedQuery = `
      SELECT 
        (SELECT COUNT(*) FROM bookings WHERE worker_id = $1) as booking_count;
    `;
    const { rows: relatedData } = await client.query(checkRelatedQuery, [id]);

    // Delete worker (CASCADE will handle related records)
    const deleteQuery = `
      DELETE FROM worker_accounts 
      WHERE worker_id = $1
      RETURNING worker_id, full_name, user_name;
    `;
    const { rows: deletedWorker } = await client.query(deleteQuery, [id]);

    if (deletedWorker.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Worker not found" });
    }

    await client.query("COMMIT");

    res.status(200).json({
      message: "Worker account deleted successfully",
      deletedWorker: deletedWorker[0],
      relatedDataDeleted: {
        bookings: relatedData[0].booking_count,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error deleting worker:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

// Worker Login
const workerLogin = async (req, res) => {
  const { user_name, password } = req.body;

  if (!user_name || !password) {
    return res.status(400).json({
      message: "Username and password are required",
    });
  }

  const client = await db.connect();
  try {
    const query = `
      SELECT * FROM worker_accounts WHERE user_name = $1;
    `;
    const { rows } = await client.query(query, [user_name]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const worker = rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      worker.password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Return worker data without password hash
    const { password_hash, ...workerData } = worker;

    res.status(200).json({
      message: "Login successful",
      worker: workerData,
    });
  } catch (err) {
    console.error("Error during worker login:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

module.exports = {
  createWorker,
  getAllWorkers,
  getWorkerById,
  getWorkersByAdminId,
  updateWorker,
  updateWorkerPassword,
  deleteWorker,
  workerLogin,
};
