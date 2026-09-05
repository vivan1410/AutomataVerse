const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for Vite frontend
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:4000',
    'http://127.0.0.1:4000',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Parsing JSON body requests
app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
  console.log(`[Express API] ${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Root URL endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: "AutomataVerse Express Server is running.",
    apiRoot: "/api"
  });
});

// Bind API routing subpath
app.use('/api', apiRoutes);

// Fallback for unmatched routes
app.use((req, res, next) => {
  const isApiRequest = req.url.startsWith('/api');
  res.status(404).json({
    success: false,
    error: isApiRequest
      ? `API route '${req.url}' not found.`
      : "Endpoint not found. Did you mean to prefix with '/api'?",
  });
});

// Centralized Error Handler
app.use(errorHandler);

// Listen to network requests
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`AutomataVerse Express Server is running!`);
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS enabled for: http://localhost:3000`);
  console.log(`Health Check: GET http://localhost:${PORT}/api/health`);
  console.log(`========================================`);
});
