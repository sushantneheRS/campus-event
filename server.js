const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import configurations
const connectDB = require('./config/database');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');
const registrationRoutes = require('./routes/registrations');
const categoryRoutes = require('./routes/categories');
const notificationRoutes = require('./routes/notifications');

// Initialize Express app
const app = express();
const server = createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://campus-event.netlify.app",
      "https://campus-event.netlify.app/*"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true
  }
});

// Database connection will be awaited before starting the server (see start() below)

// Security middleware
app.use(helmet());

// Trust proxy (needed for correct secure cookies and IPs on Render)
app.set('trust proxy', 1);

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://campus-event.netlify.app',
    'https://campus-event.netlify.app/*'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static file serving
app.use('/uploads', express.static('uploads'));

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Route debugging middleware
app.use('/api/*', (req, res, next) => {
  console.log(`🔍 Route accessed: ${req.method} ${req.originalUrl}`);
  console.log(`📍 Available routes:`, {
    auth: '/api/auth/*',
    users: '/api/users/*',
    events: '/api/events/*',
    registrations: '/api/registrations/*',
    categories: '/api/categories/*',
    notifications: '/api/notifications/*',
    dashboard: '/api/dashboard/*'
  });
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', require('./routes/dashboard'));

// Test endpoint to verify routing
app.get('/api/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    routes: {
      auth: '/api/auth',
      users: '/api/users',
      events: '/api/events',
      registrations: '/api/registrations',
      categories: '/api/categories',
      notifications: '/api/notifications',
      dashboard: '/api/dashboard'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user to their personal room
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  // Handle real-time notifications
  socket.on('send_notification', (data) => {
    io.to(`user_${data.userId}`).emit('notification', data);
  });

  // Handle event updates
  socket.on('event_update', (data) => {
    socket.broadcast.emit('event_updated', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// 404 handler (must be before error handler)
app.use('*', (req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  console.log(`📍 Available base routes:`, [
    '/api/auth',
    '/api/users',
    '/api/events',
    '/api/registrations',
    '/api/categories',
    '/api/notifications',
    '/api/dashboard',
    '/api/health',
    '/api/test'
  ]);

  res.status(404).json({
    success: false,
    message: 'Route not found',
    requestedUrl: req.originalUrl,
    method: req.method,
    availableRoutes: [
      '/api/auth/*',
      '/api/users/*',
      '/api/events/*',
      '/api/registrations/*',
      '/api/categories/*',
      '/api/notifications/*',
      '/api/dashboard/*',
      '/api/health',
      '/api/test'
    ]
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Global error handler for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

// Start server only after successful DB connection
async function start() {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

module.exports = { app, server, io };
