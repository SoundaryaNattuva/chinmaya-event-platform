import express from 'express';
import * as adminCtrl from '../controllers/admin.js'

const router = express.Router();

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