// Path: backend/server.js
// ไฟล์หลักของเซิร์ฟเวอร์ (เวอร์ชันเรียบง่าย)

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Middleware พื้นฐาน
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Static files สำหรับรูปภาพ (แค่บรรทัดเดียวพอ!)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const periodRoutes = require('./routes/periods');
const topicRoutes = require('./routes/topics');
const evaluationRoutes = require('./routes/evaluations');
const uploadRoutes = require('./routes/uploads');
const committeeRoutes = require('./routes/committee');
const reportRoutes = require('./routes/reports');

// ใช้ Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/periods', periodRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/committee', committeeRoutes);
app.use('/api/reports', reportRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: '🎯 ระบบประเมินบุคลากร API v1.0',
    status: 'Server is running!',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      periods: '/api/periods',
      topics: '/api/topics',
      evaluations: '/api/evaluations',
      uploads: '/api/uploads',
      committee: '/api/committee',
      reports: '/api/reports',
      static_files: '/uploads/:filename'
    },
    test_accounts: {
      hr: { username: 'admin', password: 'password' },
      evaluatee: { username: 'john.doe', password: 'password' },
      committee: { username: 'jane.smith', password: 'password' }
    }
  });
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const db = require('./config/database');
    const [rows] = await db.execute('SELECT COUNT(*) as user_count FROM users WHERE is_active = 1');
    res.json({
      success: true,
      message: '✅ Database connected successfully!',
      data: {
        active_users: rows[0].user_count,
        database: process.env.DB_NAME
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '❌ Database connection failed!',
      error: error.message
    });
  }
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    suggestion: 'ดู API Documentation ที่ /'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: ${process.env.DB_NAME}@${process.env.DB_HOST}`);
  console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
  console.log(`📁 Upload Directory: ${path.join(__dirname, 'uploads')}`);
  console.log('✅ Ready to accept requests!');
  console.log('📚 API Docs: http://localhost:' + PORT);
  console.log('🖼️  Static Files: http://localhost:' + PORT + '/uploads/:filename');
});

module.exports = app;