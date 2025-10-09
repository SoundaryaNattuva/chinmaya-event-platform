import express from 'express';

import * as checkinCtrl from '../controllers/checkin.js';

const router = express.Router();

// POST /api/checkin/scan - Scan QR code
router.post('/scan', checkinCtrl.scanTicket);

// POST /api/checkin/complete - Complete check-in
router.post('/complete', checkinCtrl.completeCheckin);

export default router;