require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./src/config/db');

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '16kb' })); // 16 KB per spec
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(morgan('dev'));

// Static files for uploaded photos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import Routes
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const ticketRoutes = require('./src/routes/ticketRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const feedbackRoutes = require('./src/routes/feedbackRoutes');
const authController = require('./src/controllers/authController');
const { verifyToken } = require('./src/middleware/auth');

// Root & Health check
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to आवाज (Avaaj) - Campus Maintenance Ticket & Student Grievance System API',
    institution: 'Team 21 Campus',
    version: '1.0.0',
    docs: '/api/v1/docs',
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', uptime: process.uptime(), timestamp: new Date() });
});

// Mount Routes matching CampusOS API Guide
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/fixit', ticketRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/feedbacks', feedbackRoutes);

// Direct profile endpoints matching section 3.2 of spec
app.get('/api/v1/users/me', verifyToken, authController.getProfile);
app.get('/api/v1/admin/me', verifyToken, authController.getAdminProfile);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `The endpoint ${req.method} ${req.originalUrl} does not exist.`,
      details: null,
    },
    request_id: Math.random().toString(36).substring(7),
  });
});

// Central Error Handler per CampusOS spec
app.use((err, req, res, next) => {
  console.error('[Global Error]:', err);

  if (err.message && err.message.startsWith('UNSUPPORTED_IMAGE_TYPE')) {
    return res.status(415).json({
      error: {
        code: 'UNSUPPORTED_IMAGE_TYPE',
        message: 'Only JPEG, PNG and WebP images are allowed.',
        details: null,
      },
      request_id: Math.random().toString(36).substring(7),
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: {
        code: 'IMAGE_TOO_LARGE',
        message: 'Photo exceeds maximum allowed size of 5 MB.',
        details: null,
      },
      request_id: Math.random().toString(36).substring(7),
    });
  }

  res.status(err.status || 500).json({
    error: {
      code: err.code || 'SERVER_ERROR',
      message: err.message || 'Internal server error occurred.',
      details: err.details || null,
    },
    request_id: Math.random().toString(36).substring(7),
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[Avaaj Server] Running on http://localhost:${PORT}`);
  console.log(`[API Base]: http://localhost:${PORT}/api/v1`);
});
