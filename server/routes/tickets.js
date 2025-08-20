const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const crypto = require('crypto');

const prisma = new PrismaClient();

// POST /api/tickets/types - Create ticket type for an event
router.post('/types', async (req, res) => {
  try {
    const {
      event_id,
      classification,
      quantity,
      cost,
      includes_item,
      item_name,
      ticket_description
    } = req.body;

    const ticketType = await prisma.eventTicket.create({
      data: {
        event_id,
        classification,
        quantity: parseInt(quantity),
        cost: parseInt(cost),
        includes_item: includes_item || false,
        item_name,
        ticket_description
      }
    });

    res.status(201).json(ticketType);
  } catch (error) {
    console.error('Error creating ticket type:', error);
    res.status(500).json({ error: 'Failed to create ticket type' });
  }
});

// GET /api/tickets/event/:eventId - Get available tickets for an event (endpoint is called when user visits event page and before purchase)
router.get('/event/:eventId', async (req, res) => {
  try {
    const ticketTypes = await prisma.eventTicket.findMany({
      where: { event_id: req.params.eventId },
      include: {
        _count: {
          select: { purchasedTickets: true }
        }
      }
    });

    // Calculate available quantity for each ticket type
    const ticketsWithAvailability = ticketTypes.map(ticket => ({
      ...ticket,
      available: ticket.quantity - ticket._count.purchasedTickets,
      sold: ticket._count.purchasedTickets
    }));

    res.json(ticketsWithAvailability);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// POST /api/tickets/purchase - Purchase tickets (once a user clicks on "Buy Tickets", this endpoint is called - creates ticket record, user can assign name to each ticket, and it generates a QR code)
router.post('/purchase', async (req, res) => {
  try {
    const {
      event_id,
      event_ticket_id,
      purchaser_name,
      purchaser_email,
      purchaser_phone,
      tickets // Array of ticket info: [{assigned_name: "John"}, {assigned_name: "Jane"}]
    } = req.body;

    // Check if enough tickets available before purchase is placed
    const eventTicket = await prisma.eventTicket.findUnique({
      where: { id: event_ticket_id },
      include: {
        _count: {
          select: { purchasedTickets: true }
        }
      }
    });

    const available = eventTicket.quantity - eventTicket._count.purchasedTickets;
    
    if (available < tickets.length) {
      return res.status(400).json({ 
        error: `Only ${available} tickets available, you requested ${tickets.length}` 
      });
    }

    // Create individual ticket records
    const purchasedTickets = [];
    
    for (const ticket of tickets) {
      const qrCode = `QR_${Date.now()}_${crypto.randomUUID().replace(/-/g, '').substring(0, 9)}`;
      
      const purchasedTicket = await prisma.purchasedTicket.create({
        data: {
          event_id,
          event_ticket_id,
          purchaser_name,
          purchaser_email,
          purchaser_phone,
          assigned_name: ticket.assigned_name,
          qr_code: qrCode,
          item: eventTicket.includes_item
        }
      });
      
      purchasedTickets.push(purchasedTicket);
    }

    res.status(201).json({
      message: 'Tickets purchased successfully!',
      tickets: purchasedTickets,
      total_cost: eventTicket.cost * tickets.length,
      total_tickets: tickets.length
    });

  } catch (error) {
    console.error('Error purchasing tickets:', error);
    res.status(500).json({ error: 'Failed to purchase tickets' });
  }
});

module.exports = router;