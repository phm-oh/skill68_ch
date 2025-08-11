// backend/config/database.js
// การเชื่อมต่อฐานข้อมูล MySQL

const mysql = require('mysql2/promise');

// สร้าง connection pool เพื่อจัดการการเชื่อมต่อ
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'skill68',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// ฟังก์ชันทดสอบการเชื่อมต่อ
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully!');
    console.log(`📊 Connected to: ${process.env.DB_NAME}@${process.env.DB_HOST}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// เรียกทดสอบการเชื่อมต่อเมื่อโหลดไฟล์
testConnection();

module.exports = pool;