// backend/server.js
// ไฟล์หลักของเซิร์ฟเวอร์

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware พื้นฐาน
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files สำหรับอัปโหลด
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const periodRoutes = require('./routes/periods');
const topicRoutes = require('./routes/topics');
const evaluationRoutes = require('./routes/evaluations');
const uploadRoutes = require('./routes/uploads');

// ใช้ Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/periods', periodRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/uploads', uploadRoutes);

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
      test_db: '/api/test-db'
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
    const [rows] = await db.execute('SELECT COUNT(*) as user_count FROM users WHERE status = "active"');
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

// API Documentation route
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: '📚 API Documentation',
    version: '1.0.0',
    endpoints: {
      authentication: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register (HR only)',
        me: 'GET /api/auth/me',
        logout: 'POST /api/auth/logout',
        changePassword: 'POST /api/auth/change-password'
      },
      users: {
        getAll: 'GET /api/users (HR only)',
        search: 'GET /api/users/search (HR/Committee)',
        getById: 'GET /api/users/:id',
        update: 'PUT /api/users/:id',
        updateStatus: 'PATCH /api/users/:id/status (HR only)',
        delete: 'DELETE /api/users/:id (HR only)'
      },
      periods: {
        getAll: 'GET /api/periods',
        getActive: 'GET /api/periods/active',
        create: 'POST /api/periods (HR only)',
        update: 'PUT /api/periods/:id (HR only)',
        delete: 'DELETE /api/periods/:id (HR only)'
      },
      topics: {
        getByPeriod: 'GET /api/topics/period/:periodId',
        createTopic: 'POST /api/topics/period/:periodId (HR only)',
        createCriteria: 'POST /api/topics/:topicId/criteria (HR only)'
      },
      evaluations: {
        selfEvaluate: 'POST /api/evaluations/self',
        submitEvaluation: 'POST /api/evaluations/submit/:periodId',
        committeeEvaluate: 'POST /api/evaluations/committee/:evaluationId',
        getMyScore: 'GET /api/evaluations/score/:periodId'
      }
    },
    test_routes: {
      auth: '/api/auth/test',
      users: '/api/users/test/info',
      database: '/api/test-db'
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'เกิดข้อผิดพลาดในระบบ',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    suggestion: 'ดู API Documentation ที่ /api'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🗄️  Database: ${process.env.DB_NAME}@${process.env.DB_HOST}`);
  console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN}`);
  console.log(`📁 Upload Directory: ${path.join(__dirname, 'uploads')}`);
  console.log('✅ Ready to accept requests!');
  console.log('📚 API Docs: http://localhost:' + PORT + '/api');
});

module.exports = app;