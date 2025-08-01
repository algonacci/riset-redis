require("dotenv").config();
const mysql = require("mysql2/promise"); // Use the promise version of mysql2

// Create the connection pool (or a connection object if you prefer)
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  timezone: "+07:00", // Explicitly set timezone to Asia/Jakarta (+7)
});

module.exports = { db };
