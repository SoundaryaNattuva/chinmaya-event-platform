import express from 'express';
import * as checkinCtrl from '../controllers/checkin.js';

const router = express.Router();
// api/checkin/...

// GET - Search for attendees in a specific event
router.get('/events/:eventId/search', checkinCtrl.searchAttendees);

// GET - Get all tickets in an order (for group check-in) - ADD THIS
router.get('/events/:eventId/order/:orderId/tickets', checkinCtrl.getOrderTickets);

// POST - Check in a ticket
router.post('/events/:eventId/checkin/:ticketId', checkinCtrl.checkInTicket);

// POST - Redeem item
router.post('/events/:eventId/checkin/:ticketId/redeem', checkinCtrl.redeemItem);

// POST - Group check-in
router.post('/events/:eventId/group', checkinCtrl.groupCheckIn);

// GET - Get ticket details
router.get('/events/:eventId/ticket/:ticketId', checkinCtrl.getTicketDetails);

// POST - Scan QR code (your existing route)
router.post('/scan', checkinCtrl.scanTicket);

// POST - Complete check-in (your existing route)
router.post('/complete', checkinCtrl.completeCheckin);

export default router;