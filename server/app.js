const express = require('express');
const cors = require('cors');
const { authenticateToken, requireAdmin, requireStaff } = require('./middleware/auth'); 
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Public Routes
app.use('/api/events', require('./routes/events'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/auth', require('./routes/auth'));

// Protected Routes
app.use('/api/admin', authenticateToken, requireAdmin, require('./routes/admin'));
app.use('/api/checkin', authenticateToken, requireStaff, require('./routes/checkin'));

module.exports = app;