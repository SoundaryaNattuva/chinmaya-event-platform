const express = require('express');
const router = express.Router();
import * as ticketCtrl from '../controllers/tickets.js';


router.post('/types', ticketCtrl.createTicketType);
router.get('/event/:eventId', ticketCtrl.getTicketsByEvent);
router.post('/purchase', ticketCtrl.purchaseTickets);

module.exports = router;