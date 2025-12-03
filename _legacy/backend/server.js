const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const gmailRoutes = require('./routes/gmail');
const apiRoutes = require('./routes/api');
const sequenceExecutionRoutes = require('./routes/sequenceExecution');
const sequencesRoutes = require('./routes/sequences');
const templatesRoutes = require('./routes/templates');
const labelsRoutes = require('./routes/labels');
const crmRoutes = require('./routes/crm');
const timerRoutes = require('./routes/timer');
const testRoutes = require('./routes/test');
const monitoringRoutes = require('./routes/monitoring');
const settingsRoutes = require('./routes/settings');

// Import database to ensure tables are created
require('./config/database');

// Import and start cleanup service
require('./services/cleanupService');

// Import and start reply detection service
require('./services/replyDetection');

const app = express();
const PORT = process.env.PORT || 3001;

// Configure CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Default CORS origins if not set
    const corsOrigins = process.env.CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000,file://';
    const allowedOrigins = corsOrigins.split(',').map(o => o.trim());
    
    // Check if the origin is in the allowed list or starts with file://
    if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('file://')) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to all requests
app.use(limiter);

// Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(express.json({ limit: '10mb' })); // Set JSON payload limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/auth', authLimiter, authRoutes);
app.use('/gmail', gmailRoutes);
app.use('/api', apiRoutes);
app.use('/sequence-execution', sequenceExecutionRoutes);
app.use('/api/sequences', sequencesRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/labels', labelsRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/timer', timerRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/test', testRoutes); // Test endpoints for debugging
app.use('/monitoring', monitoringRoutes); // Monitoring endpoints

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  if (error.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS policy violation' });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Gmail Inbox Manager Backend running on port ${PORT}`);
  console.log(`📧 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`🌐 CORS Origins: ${process.env.CORS_ORIGINS}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Promise Rejection:', reason);
  console.error('Promise:', promise);
  // Don't exit the process, but log it for debugging
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  // For uncaught exceptions, we should exit gracefully
  console.log('🛑 Shutting down due to uncaught exception...');
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  process.exit(0);
});
