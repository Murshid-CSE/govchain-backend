const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { generalLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');
const { sendSuccess } = require('./utils/apiResponse');
const { prisma } = require('./config/database');

// Module routes
const authRoutes = require('./modules/auth/auth.routes');
const issueRoutes = require('./modules/issues/issue.routes');
const departmentRoutes = require('./modules/departments/department.routes');
const taskRoutes = require('./modules/tasks/task.routes');
const tenderRoutes = require('./modules/tenders/tender.routes');
const budgetRoutes = require('./modules/budgets/budget.routes');
const grievanceRoutes = require('./modules/grievances/grievance.routes');
const pollRoutes = require('./modules/polls/poll.routes');
const auditRoutes = require('./modules/audit/audit.routes');
const chatRoutes = require('./modules/chat/chat.routes');
const moderationRoutes = require('./modules/moderation/moderation.routes');
const uploadRoutes = require('./modules/uploads/upload.routes');

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Rate limiting on API routes
app.use('/api/', generalLimiter);

// Custom request logger in development
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ============================================
// HEALTH CHECK ENDPOINTS
// ============================================

// Liveness probe
app.get('/api/v1/health', (req, res) => {
  return sendSuccess(res, {
    statusCode: 200,
    message: 'GovChain API is live',
    data: {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0',
    },
  });
});

// Readiness probe (verifies database connection)
app.get('/api/v1/health/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return sendSuccess(res, {
      statusCode: 200,
      message: 'GovChain API is ready',
      data: {
        database: 'connected',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      message: 'Service unavailable - database not reachable',
      data: { database: 'disconnected', error: error.message },
    });
  }
});

// ============================================
// MOUNT MODULE API ROUTES (v1)
// ============================================

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/issues', issueRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/tenders', tenderRoutes);
app.use('/api/v1/budgets', budgetRoutes);
app.use('/api/v1/grievances', grievanceRoutes);
app.use('/api/v1/polls', pollRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/moderation', moderationRoutes);
app.use('/api/v1/uploads', uploadRoutes);

// Root informational endpoint
app.get('/', (req, res) => {
  return sendSuccess(res, {
    statusCode: 200,
    message: 'Welcome to GovChain Civic Transparency Platform API',
    data: {
      documentation: '/api/v1/health',
      version: process.env.APP_VERSION || '1.0.0',
      modules: [
        '/api/v1/auth',
        '/api/v1/issues',
        '/api/v1/departments',
        '/api/v1/tasks',
        '/api/v1/tenders',
        '/api/v1/budgets',
        '/api/v1/grievances',
        '/api/v1/polls',
        '/api/v1/audit',
        '/api/v1/chat',
        '/api/v1/moderation',
      ],
    },
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
