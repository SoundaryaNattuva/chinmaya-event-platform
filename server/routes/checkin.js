const express = require('express');
const prisma = require('../lib/prisma');
const router = express.Router();


// POST /api/checkin/scan - Scan QR code (shows info, doesn't check in yet)
router.post('/scan', async (req, res) => {
  try {
    const { qr_code } = req.body;

    const ticket = await prisma.purchasedTicket.findUnique({
      where: { qr_code: qr_code },
      include: {
        event: true,
        eventTicket: true
      }
    });

    if (!ticket) {
      return res.status(404).json({ 
        status: 'invalid',
        message: 'Invalid QR Code - Ticket not found' 
      });
    }

    if (ticket.checked_in) {
      return res.status(400).json({
        status: 'already_checked_in',
        message: `${ticket.assigned_name} already checked in at ${new Date(ticket.checked_in_at).toLocaleString()}`,
        ticket_info: {
          name: ticket.assigned_name,
          event: ticket.event.name,
          ticket_type: ticket.eventTicket.classification
        }
      });
    }

    // Build clean response object
    const response = {
      status: 'valid',
      ticket_info: {
        assigned_name: ticket.assigned_name,
        purchaser_name: ticket.purchaser_name,
        purchaser_email: ticket.purchaser_email,
        event_name: ticket.event.name,
        ticket_type: ticket.eventTicket.classification,
        ticket_cost: ticket.eventTicket.cost,
        purchase_date: ticket.purchase_date
      },
      actions: {
        can_check_in: true,
        ticket_id: ticket.id
      }
    };

    // Only add item fields if this ticket includes an item
    if (ticket.eventTicket.includes_item) {
      response.actions.needs_item = true;
      response.actions.item_to_give = ticket.eventTicket.item_name;
    }

    res.json(response);

  } catch (error) {
    console.error('Error scanning ticket:', error);
    res.status(500).json({ error: 'Failed to scan ticket' });
  }
});

// POST /api/checkin/complete - Actually check the person in
router.post('/complete', async (req, res) => {
  try {
    console.log('req.body:', req.body);
    const { ticket_id, item_given, volunteer_name } = req.body;

    const updatedTicket = await prisma.purchasedTicket.update({
      where: { id: ticket_id }, // find the ticket ID
      data: {                   // what to change within the ticket
        checked_in: true,
        checked_in_at: new Date(),
        checked_in_by: volunteer_name || 'Volunteer',
        item_collected: item_given || false
      },
      include: {
        event: true,
        eventTicket: true
      }
    });

    res.json({
      status: 'success',
      message: `${updatedTicket.assigned_name} is successfully checked in!`,
      checked_in_at: updatedTicket.checked_in_at,
      item_given: item_given
    });

  } catch (error) {
    console.error('Error completing check-in:', error);
    res.status(500).json({ error: 'Failed to complete check-in' });
  }
});

module.exports = router;