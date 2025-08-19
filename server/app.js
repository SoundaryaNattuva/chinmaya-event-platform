const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'EventFlow API is running!' });
});

// Routes (we'll add these step by step)
// app.use('/api/events', require('./routes/events'));

module.exports = app;