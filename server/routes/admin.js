const express = require('express');
const router = express.Router();
import * as adminCtrl from '../controllers/admin.js'

// Event routes
router.post('/events', adminCtrl.createEvent);
router.delete('/events/:id', adminCtrl.deleteEvent);
router.put('/events/:id', adminCtrl.updateEvent);
router.get('/events/:id', adminCtrl.getEvent);
// Ticket routes
router.get('/events/:eventId/tickets', adminCtrl.getTickets);
router.post('/events/:eventId/tickets', adminCtrl.createTicket);
router.put('/events/:eventId/tickets/:ticketId', adminCtrl.updateTicket);
router.delete('/events/:eventId/tickets/:ticketId', adminCtrl.deleteTicket);

export default router;