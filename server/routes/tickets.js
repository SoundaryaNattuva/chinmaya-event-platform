const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

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

// GET /api/tickets/event/:eventId - Get available tickets for an event
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

module.exports = router;