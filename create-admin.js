const bcrypt = require("bcrypt");
const pool = require("./src/config/db");

async function createAdmin() {
  try {
    console.log("🔄 Creating admin account...\n");

    // Check if admin already exists
    const checkResult = await pool.query(
      "SELECT * FROM admin_accounts WHERE email = $1",
      ["admin@railway.com"]
    );

    if (checkResult.rows.length > 0) {
      console.log("⚠️  Admin account already exists!");
      console.log("\n╔══════════════════════════════════════╗");
      console.log("║     EXISTING LOGIN CREDENTIALS       ║");
      console.log("╠══════════════════════════════════════╣");
      console.log("║  Email:    admin@railway.com         ║");
      console.log("║  Password: admin123                  ║");
      console.log("╚══════════════════════════════════════╝\n");
      process.exit(0);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // Insert admin account
    const result = await pool.query(
      `INSERT INTO admin_accounts 
       (admin_id, full_name, email, mobile_number, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      ["ADM001", "Admin User", "admin@railway.com", "9999999999", hashedPassword, "Admin"]
    );

    console.log("✅ Admin account created successfully!\n");
    console.log("╔══════════════════════════════════════╗");
    console.log("║     LOGIN CREDENTIALS                ║");
    console.log("╠══════════════════════════════════════╣");
    console.log("║  Email:    admin@railway.com         ║");
    console.log("║  Password: admin123                  ║");
    console.log("╚══════════════════════════════════════╝\n");
    console.log("Admin Details:");
    console.log("- ID:", result.rows[0].admin_id);
    console.log("- Name:", result.rows[0].full_name);
    console.log("- Email:", result.rows[0].email);
    console.log("- Mobile:", result.rows[0].mobile_number);
    console.log("- Role:", result.rows[0].role);
    console.log("\n✅ You can now login to the application!\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin account:", error.message);
    console.error("\nFull error:", error);
    process.exit(1);
  }
}

createAdmin();
