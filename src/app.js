require('express-async-errors'); // Automatically catches async errors
const express = require('express');
const path = require('path');
const cors = require('cors');
const { errorHandler } = require('./middlewares/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const teamRoutes = require('./routes/teamRoutes');


const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON payloads

// Serve static files from uploads folder
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/teams', teamRoutes);


// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
