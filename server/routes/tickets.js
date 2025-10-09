import express from 'express';
import * as ticketCtrl from '../controllers/tickets.js';

const router = express.Router();

router.post('/types', ticketCtrl.createTicketType);
router.get('/event/:eventId', ticketCtrl.getTicketsByEvent);
router.post('/purchase', ticketCtrl.purchaseTickets);

export default router;