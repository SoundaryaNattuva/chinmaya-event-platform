const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllEvents = async (req, res) => {
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
};

const getEventById = async (req, res) => {
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
};

module.exports = {
  getAllEvents,
  getEventById
};