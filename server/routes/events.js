const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// POST /api/events - Create new event (admin only - we'll add auth later)
router.post('/', async (req, res) => {
  try {
    const {
      name,
      start_datetime,
      end_datetime,
      location,
      longitude,
      latitude,
      image,
      short_descrip,
      description
    } = req.body;

    const event = await prisma.event.create({
      data: {
        name,
        start_datetime: new Date(start_datetime),
        end_datetime: new Date(end_datetime),
        location,
        longitude: parseFloat(longitude),
        latitude: parseFloat(latitude),
        image,
        short_descrip,
        description
      }
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// DELETE api/events/:id - Delete an event (admin only - we'll add auth later)
router.delete('/:id', async (req, res) => {
  try {
    const eventId = req.params.id;  

    await prisma.event.delete({
      where: { id: eventId }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// PUT /api/events/:id - Update event details (safe fields only)
router.put('/:id', async (req, res) => {
  try {
    const { 
      name, 
      description, 
      short_descrip,
      location, 
      longitude,
      latitude,
      image,
      start_datetime, 
      end_datetime 
    } = req.body;

    // Only update safe fields - NO ticket quantities or prices
    const updatedEvent = await prisma.event.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        short_descrip,
        location,
        longitude: longitude ? parseFloat(longitude) : undefined,
        latitude: latitude ? parseFloat(latitude) : undefined,
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

// GET /api/events - Get all events
router.get('/', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        eventTickets: true,
        _count: {
          select: { purchasedTickets: true }
        }
      },
      orderBy: { start_datetime: 'asc' }
    });
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /api/events/:id - Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        eventTickets: true,
        _count: {
          select: { purchasedTickets: true }
        }
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

module.exports = router;