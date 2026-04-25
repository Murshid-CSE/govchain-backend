// ============================================
// GOVCHAIN BACKEND SERVER
// Entry point of the entire application
// ============================================

// Load environment variables from .env file
// Must be the very first thing that runs
const dotenv = require('dotenv');
dotenv.config();

// Import Express framework
const express = require('express');

// Import CORS middleware
const cors = require('cors');

// Create the Express application
const app = express();

// ============================================
// MIDDLEWARE SETUP
// Middleware = functions that run on every request
// before it reaches your route handlers
// ============================================

// Enable CORS — allows frontend (React) to call this backend
// Without this, the browser blocks cross-origin requests
app.use(cors());

// Parse incoming JSON requests
// Without this, req.body will be undefined
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// ============================================
// REQUEST LOGGER (Custom Middleware)
// Logs every incoming request to the terminal
// Helps you see what is happening in real time
// ============================================

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next(); // Move to the next middleware or route
});

// ============================================
// ROUTES
// ============================================

// Root route — confirms server is running
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to GovChain API',
    version: process.env.APP_VERSION,
    environment: process.env.NODE_ENV,
  });
});

// Health check route
// Used to verify the server is alive
// Common in real-world production systems
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'Server is running',
    app: process.env.APP_NAME,
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())} seconds`,
  });
});

// API info route
// Shows available modules — useful during development
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'GovChain API is ready',
    modules: [
      'auth        → User authentication (Phase 2)',
      'tenders     → Tender management (Phase 2)',
      'voting      → Public voting system (Phase 3)',
      'issues      → Citizen issue reporting (Phase 3)',
      'blockchain  → Audit logs (Phase 4)',
    ],
  });
});

// ============================================
// 404 HANDLER
// Catches any route that does not exist
// Must come AFTER all valid routes
// ============================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`,
  });
});

// ============================================
// GLOBAL ERROR HANDLER
// Catches any error thrown inside route handlers
// Must have exactly 4 parameters: err, req, res, next
// ============================================

app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// ============================================
// START THE SERVER
// ============================================

// Read PORT from .env — if not found, use 5000 as default
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('========================================');
  console.log(`  ${process.env.APP_NAME} Backend Server`);
  console.log('========================================');
  console.log(`  Status    : Running`);
  console.log(`  Port      : ${PORT}`);
  console.log(`  Mode      : ${process.env.NODE_ENV}`);
  console.log(`  URL       : http://localhost:${PORT}`);
  console.log('========================================');
});