const express = require('express');
const router = express.Router();
const { scanTicket, completeCheckin } = require('../controllers/checkinController');

// POST /api/checkin/scan - Scan QR code
router.post('/scan', scanTicket);

// POST /api/checkin/complete - Complete check-in
router.post('/complete', completeCheckin);

module.exports = router;