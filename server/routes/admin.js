const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// Helper function to check if any tickets have been sold
const hasTicketSales = async (eventId) => {
  const ticketsWithSales = await prisma.eventTicket.findMany({
    where: { event_id: eventId },
    select: { sold_count: true }
  });  
  return ticketsWithSales.some(ticket => ticket.sold_count > 0);
};

// POST /api/admin/events - Create new event with tickets (admin only)
router.post('/events', async (req, res) => {
  console.log('Received payload:', req.body);
  try {
    const {
      name,
      start_datetime,
      end_datetime,
      location,
      place_id,
      image,
      short_descrip,
      description,
      tickets // Array of ticket objects
    } = req.body;

    // Use Prisma transaction to create event and tickets together
    const result = await prisma.$transaction(async (prisma) => {
      // Create the event first
      const event = await prisma.event.create({
        data: {
          name,
          start_datetime: new Date(start_datetime),
          end_datetime: new Date(end_datetime),
          location,
          place_id,
          image,
          short_descrip,
          description,
        }
      });

      // Create all tickets for this event
      const eventTickets = await Promise.all(
        tickets.map(ticket => 
          prisma.eventTicket.create({
            data: {
              event_id: event.id,
              classification: ticket.classification,
              quantity: ticket.quantity,
              cost: ticket.cost,
              includes_item: ticket.includes_item || false,
              item_name: ticket.item_name || null,
            }
          })
        )
      );

      return {
        event,
        tickets: eventTickets
      };
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating event with tickets:', error);
    res.status(500).json({ error: 'Failed to create event with tickets' });
  }
});

// DELETE api/admin/events/:id - Delete an event (admin only - we'll add auth later)
router.delete('/events/:id', async (req, res) => {
  const eventId = req.params.id;
  console.log('eventId:', eventId);
  try {
    // First delete all tickets for this event bc event has tickets as FK
    await prisma.eventTicket.deleteMany({
      where: { event_id: eventId }
    });
    //Delete event
    await prisma.event.delete({
      where: { id: eventId }
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// PUT /api/admin/events/:id - Update event details (safe fields only)
router.put('/events/:id', async (req, res) => {
  const eventId = req.params.id;
  const salesStarted = false;

  try {
    const { 
      name, 
      short_descrip,
      description, 
      location,
      place_id,
      image,
      start_datetime, 
      end_datetime,
      tickets 
    } = req.body;

    // Only update safe fields - NO ticket quantities or prices
    const updatedEvent = await prisma.event.update({
      where: { id: req.params.id },
      data: {
        name,
        short_descrip,
        description,
        location,
        place_id,
        image,
        start_datetime: start_datetime ? new Date(start_datetime) : undefined,
        end_datetime: end_datetime ? new Date(end_datetime) : undefined
      }
    });
    res.json({
      message: 'Event updated successfully',
      event: updatedEvent
    });

  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// GET api/admin/events/:id - Get single event for editing
router.get('/events/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    console.log('Getting event:', eventId);
    
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        eventTickets: true  // Include tickets if needed
      }
    });
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});


// HTTP Routes for Tickets (GET, POST, PUT, DELETE)
// GET api/admin/events/:eventId/tickets
router.get('/events/:eventId/tickets', async (req, res) => {
  const eventId = req.params.eventId;
  try {
    const tickets = await prisma.eventTicket.findMany({
      where: { event_id: eventId }
    });
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

//DELETE api/admin/events/:eventId/tickets/:ticketId
router.delete('/events/:eventId/tickets/:ticketId', async (req, res) => {
  const { eventId, ticketId } = req.params;
  try {
    await prisma.eventTicket.delete({
      where: {
        id: ticketId,
        event_id: eventId
      }
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting ticket:', error);
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
});

// POST api/admin/events/:eventId/tickets
router.post('/events/:eventId/tickets', async (req, res) => {
  const eventId = req.params.eventId;
  const { classification, quantity, cost, includes_item, item_name } = req.body;

  try {
    const newTicket = await prisma.eventTicket.create({
      data: {
        classification,
        quantity,
        cost,
        includes_item,
        item_name,
        event: {
          connect: { id: eventId }
        }
      }
    });
    res.status(201).json(newTicket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

//PUT api/admin/events/:eventId/tickets/:ticketId
router.put('/events/:eventId/tickets/:ticketId', async (req, res) => {
  const { eventId, ticketId } = req.params;
  const { classification, quantity, cost, includes_item, item_name } = req.body;

  try {
    const updatedTicket = await prisma.eventTicket.update({
      where: {
        id: ticketId,
        event_id: eventId
      },
      data: {
        classification,
        quantity,
        cost,
        includes_item,
        item_name
      }
    });
    res.json(updatedTicket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

module.exports = router;