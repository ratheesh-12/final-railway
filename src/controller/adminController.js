// Packages
const bcrypt = require("bcrypt");

// Import from the Database folder
const db = require("../config/db.js");

// Create Admin Account
const createAdmin = async (req, res) => {
  const { full_name, email, mobile_number, password } = req.body;

  // Validation
  if (!full_name || !email || !password) {
    return res.status(400).json({
      message: "Full name, email, and password are required",
    });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // Check if admin already exists with email or mobile number
    const checkQuery = `
      SELECT * FROM admin_accounts 
      WHERE email = $1 OR mobile_number = $2;
    `;
    const { rows: existingAdmins } = await client.query(checkQuery, [
      email,
      mobile_number,
    ]);

    if (existingAdmins.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "Admin with this email or mobile number already exists",
      });
    }

    // Generate new admin_id (ADM001, ADM002, etc.)
    const getLastIdQuery = `
      SELECT admin_id FROM admin_accounts 
      ORDER BY admin_id DESC 
      LIMIT 1;
    `;
    const { rows: lastAdmin } = await client.query(getLastIdQuery);

    let newAdminId;
    if (lastAdmin.length === 0) {
      // First admin
      newAdminId = "ADM001";
    } else {
      // Extract number from last admin_id and increment
      const lastId = lastAdmin[0].admin_id;
      const lastNumber = parseInt(lastId.replace("ADM", ""));
      const newNumber = lastNumber + 1;
      newAdminId = `ADM${String(newNumber).padStart(3, "0")}`;
    }

    // Hash the password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert new admin with auto-generated ID and default role
    const insertQuery = `
      INSERT INTO admin_accounts (
        admin_id, full_name, email, mobile_number, password_hash, role
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING admin_id, full_name, email, mobile_number, role, created_at, updated_at;
    `;

    const values = [
      newAdminId,
      full_name,
      email,
      mobile_number || null,
      password_hash,
      "Admin", // Default role
    ];

    const { rows } = await client.query(insertQuery, values);

    await client.query("COMMIT");

    res.status(201).json({
      message: "Admin account created successfully",
      admin: rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error creating admin account:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

// Get All Admins
const getAllAdmins = async (req, res) => {
  const client = await db.connect();
  try {
    const query = `
      SELECT admin_id, full_name, email, mobile_number, role, created_at, updated_at 
      FROM admin_accounts
      ORDER BY created_at DESC;
    `;

    const { rows } = await client.query(query);

    res.status(200).json({
      message: "Admins retrieved successfully",
      count: rows.length,
      admins: rows,
    });
  } catch (err) {
    console.error("Error retrieving admins:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

// Get Admin by ID
const getAdminById = async (req, res) => {
  const { id } = req.params;

  if (!id || id.trim() === "") {
    return res.status(400).json({ message: "Admin ID is required" });
  }

  const client = await db.connect();
  try {
    const query = `
      SELECT admin_id, full_name, email, mobile_number, role, created_at, updated_at 
      FROM admin_accounts
      WHERE admin_id = $1;
    `;

    const { rows } = await client.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.status(200).json({
      message: "Admin retrieved successfully",
      admin: rows[0],
    });
  } catch (err) {
    console.error("Error retrieving admin:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

// Update Admin Details
const updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { full_name, email, mobile_number, role } = req.body;

  if (!id || id.trim() === "") {
    return res.status(400).json({ message: "Admin ID is required" });
  }

  // Check if at least one field is provided for update
  if (!full_name && !email && !mobile_number && !role) {
    return res.status(400).json({
      message: "At least one field must be provided for update",
    });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // Check if admin exists
    const checkQuery = `SELECT * FROM admin_accounts WHERE admin_id = $1;`;
    const { rows: existingAdmin } = await client.query(checkQuery, [id]);

    if (existingAdmin.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Admin not found" });
    }

    // Check for duplicate email or mobile number (excluding current admin)
    if (email || mobile_number) {
      const duplicateQuery = `
        SELECT * FROM admin_accounts 
        WHERE (email = $1 OR mobile_number = $2) AND admin_id != $3;
      `;
      const { rows: duplicates } = await client.query(duplicateQuery, [
        email || "",
        mobile_number || "",
        id,
      ]);

      if (duplicates.length > 0) {
        await client.query("ROLLBACK");
        return res.status(409).json({
          message: "Email or mobile number already in use by another admin",
        });
      }
    }

    // Update admin
    const updateQuery = `
      UPDATE admin_accounts
      SET full_name = COALESCE($1, full_name),
          email = COALESCE($2, email),
          mobile_number = COALESCE($3, mobile_number),
          role = COALESCE($4, role),
          updated_at = CURRENT_TIMESTAMP
      WHERE admin_id = $5
      RETURNING admin_id, full_name, email, mobile_number, role, created_at, updated_at;
    `;

    const values = [full_name, email, mobile_number, role, id];

    const { rows } = await client.query(updateQuery, values);

    await client.query("COMMIT");

    res.status(200).json({
      message: "Admin details updated successfully",
      admin: rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error updating admin:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

// Update Admin Password
const updateAdminPassword = async (req, res) => {
  const { id } = req.params;
  const { current_password, new_password } = req.body;

  if (!id || id.trim() === "") {
    return res.status(400).json({ message: "Admin ID is required" });
  }

  if (!current_password || !new_password) {
    return res.status(400).json({
      message: "Current password and new password are required",
    });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // Get admin with password hash
    const getAdminQuery = `
      SELECT * FROM admin_accounts WHERE admin_id = $1;
    `;
    const { rows } = await client.query(getAdminQuery, [id]);

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Admin not found" });
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
      UPDATE admin_accounts
      SET password_hash = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE admin_id = $2
      RETURNING admin_id, full_name, email, role;
    `;

    const { rows: updatedRows } = await client.query(updateQuery, [
      new_password_hash,
      id,
    ]);

    await client.query("COMMIT");

    res.status(200).json({
      message: "Password updated successfully",
      admin: updatedRows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error updating password:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

// Delete Admin Account
const deleteAdmin = async (req, res) => {
  const { id } = req.params;

  if (!id || id.trim() === "") {
    return res.status(400).json({ message: "Admin ID is required" });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // Check if admin exists and has related data
    const checkRelatedQuery = `
      SELECT 
        (SELECT COUNT(*) FROM worker_accounts WHERE admin_id = $1) as worker_count,
        (SELECT COUNT(*) FROM bookings WHERE admin_id = $1) as booking_count;
    `;
    const { rows: relatedData } = await client.query(checkRelatedQuery, [id]);

    // Delete admin (CASCADE will handle related records)
    const deleteQuery = `
      DELETE FROM admin_accounts 
      WHERE admin_id = $1
      RETURNING admin_id, full_name, email, role;
    `;
    const { rows: deletedAdmin } = await client.query(deleteQuery, [id]);

    if (deletedAdmin.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Admin not found" });
    }

    await client.query("COMMIT");

    res.status(200).json({
      message: "Admin account deleted successfully",
      deletedAdmin: deletedAdmin[0],
      relatedDataDeleted: {
        workers: relatedData[0].worker_count,
        bookings: relatedData[0].booking_count,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error deleting admin:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

// Admin Login
const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  const client = await db.connect();
  try {
    const query = `
      SELECT * FROM admin_accounts WHERE email = $1;
    `;
    const { rows } = await client.query(query, [email]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const admin = rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Return admin data without password hash
    const { password_hash, ...adminData } = admin;

    res.status(200).json({
      message: "Login successful",
      admin: adminData,
    });
  } catch (err) {
    console.error("Error during admin login:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

module.exports = {
  createAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  updateAdminPassword,
  deleteAdmin,
  adminLogin,
};
