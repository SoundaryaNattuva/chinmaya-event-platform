const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/events', require('./routes/events'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/checkin', require('./routes/checkin'));

module.exports = app;