import prisma from '../lib/prisma.js';

// Search for attendees in a specific event
export const searchAttendees = async (req, res) => {
  const { eventId } = req.params;
  const { q } = req.query; // search query

  try {
    // Search using Prisma's where clause
    const tickets = await prisma.purchasedTicket.findMany({
      where: {
        event_id: eventId,
        OR: [
          { assigned_name: { contains: q, mode: 'insensitive' } },
          { purchaser_name: { contains: q, mode: 'insensitive' } },
          { purchaser_email: { contains: q, mode: 'insensitive' } },
          { purchaser_phone: { contains: q, mode: 'insensitive' } },
          { order_id: { contains: q, mode: 'insensitive' } }
        ]
      },
      include: {
        eventTicket: true,
        event: true
      },
      take: 20,
      orderBy: {
        assigned_name: 'asc'
      }
    });

    // Format response to match frontend expectations
    const formattedTickets = tickets.map(ticket => ({
      id: ticket.id,
      event_id: ticket.event_id,
      order_id: ticket.order_id,
      attendee_name: ticket.assigned_name,
      email: ticket.purchaser_email,
      phone: ticket.purchaser_phone,
      checked_in: ticket.checked_in,
      check_in_time: ticket.checked_in_at,
      item_redeemed: ticket.item_collected,
      item_redeem_time: null, // You might want to add this field to your schema
      cancelled: false, // Add this field if needed
      ticket_type: ticket.eventTicket.classification,
      has_item: ticket.eventTicket.includes_item,
      group_size: 1 // You might need to calculate this from order_id
    }));

    res.json(formattedTickets);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
};

// Check in a ticket
export const checkInTicket = async (req, res) => {
  const { eventId, ticketId } = req.params;
  const staffId = req.user.id; // From auth middleware

  try {
    // Verify ticket belongs to this event
    const ticket = await prisma.purchasedTicket.findFirst({
      where: {
        id: ticketId,
        event_id: eventId
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found for this event' });
    }

    // Check if already checked in
    if (ticket.checked_in) {
      return res.status(400).json({ 
        error: 'Ticket already checked in',
        check_in_time: ticket.checked_in_at 
      });
    }

    // Update ticket to checked in
    const updatedTicket = await prisma.purchasedTicket.update({
      where: { id: ticketId },
      data: {
        checked_in: true,
        checked_in_at: new Date(),
        checked_in_by: staffId
      }
    });

    res.json({
      success: true,
      ticket: updatedTicket,
      message: 'Check-in successful'
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Check-in failed' });
  }
};

// Redeem item
export const redeemItem = async (req, res) => {
  const { eventId, ticketId } = req.params;
  const staffId = req.user.id;

  try {
    // Verify ticket belongs to this event and get ticket type info
    const ticket = await prisma.purchasedTicket.findFirst({
      where: {
        id: ticketId,
        event_id: eventId
      },
      include: {
        eventTicket: true
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found for this event' });
    }

    // Check if ticket has an item
    if (!ticket.eventTicket.includes_item) {
      return res.status(400).json({ error: 'This ticket does not include an item' });
    }

    // Check if already redeemed
    if (ticket.item_collected) {
      return res.status(400).json({ 
        error: 'Item already redeemed',
        item_redeem_time: ticket.item_collected_at
      });
    }

    // Update ticket to item redeemed
    const updatedTicket = await prisma.purchasedTicket.update({
      where: { id: ticketId },
      data: {
        item_collected: true,
        item_collected_at: new Date(),
        item_collected_by: staffId
      }
    });

    res.json({
      success: true,
      ticket: updatedTicket,
      message: 'Item redeemed successfully'
    });
  } catch (error) {
    console.error('Redeem error:', error);
    res.status(500).json({ error: 'Item redemption failed' });
  }
};

// Get ticket details
export const getTicketDetails = async (req, res) => {
  const { eventId, ticketId } = req.params;

  try {
    const ticket = await prisma.purchasedTicket.findFirst({
      where: {
        id: ticketId,
        event_id: eventId
      },
      include: {
        eventTicket: true,
        event: true
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Format the response to match what the frontend expects
    const formattedTicket = {
      id: ticket.id,
      event_id: ticket.event_id,
      order_id: ticket.order_id,
      attendee_name: ticket.assigned_name,
      email: ticket.purchaser_email,
      phone: ticket.purchaser_phone,
      checked_in: ticket.checked_in,
      check_in_time: ticket.checked_in_at,
      checked_in_by: ticket.checked_in_by,
      item_redeemed: ticket.item_collected,
      ticket_type: ticket.eventTicket.classification,
      has_item: ticket.eventTicket.includes_item,
      item_name: ticket.eventTicket.item_name,
      event_name: ticket.event.name,
      qr_code: ticket.qr_code,
      group_size: 1 // You might need to calculate this
    };

    res.json(formattedTicket);
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ error: 'Failed to get ticket details' });
  }
};

// Group check-in
export const groupCheckIn = async (req, res) => {
  const { eventId } = req.params;
  const { ticketIds } = req.body; // Array of ticket IDs
  const staffId = req.user.id;

  try {
    // Check in multiple tickets at once
    const result = await prisma.purchasedTicket.updateMany({
      where: {
        id: { in: ticketIds },
        event_id: eventId,
        checked_in: false
      },
      data: {
        checked_in: true,
        checked_in_at: new Date(),
        checked_in_by: staffId
      }
    });

    res.json({
      success: true,
      checkedInCount: result.count,
      message: `${result.count} ticket(s) checked in successfully`
    });
  } catch (error) {
    console.error('Group check-in error:', error);
    res.status(500).json({ error: 'Group check-in failed' });
  }
};

// Scan QR code and get ticket info
export const scanTicket = async (req, res) => {
  const { qrCode } = req.body;

  try {
    const ticket = await prisma.purchasedTicket.findUnique({
      where: { qr_code: qrCode },
      include: {
        eventTicket: true,
        event: true
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Invalid QR code' });
    }

    // Format response
    const formattedTicket = {
      id: ticket.id,
      event_id: ticket.event_id,
      order_id: ticket.order_id,
      attendee_name: ticket.assigned_name,
      email: ticket.purchaser_email,
      phone: ticket.purchaser_phone,
      checked_in: ticket.checked_in,
      check_in_time: ticket.checked_in_at,
      item_redeemed: ticket.item_collected,
      ticket_type: ticket.eventTicket.classification,
      has_item: ticket.eventTicket.includes_item,
      event_name: ticket.event.name,
      cancelled: false
    };

    res.json(formattedTicket);
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ error: 'Scan failed' });
  }
};

export const completeCheckin = async (req, res) => {
  // Keep your existing implementation if you have one
  res.json({ message: 'Complete checkin endpoint' });
};

// Get all tickets for an order (for group check-in)
export const getOrderTickets = async (req, res) => {
  const { eventId, orderId } = req.params;

  try {
    const tickets = await prisma.purchasedTicket.findMany({
      where: {
        event_id: eventId,
        order_id: orderId
      },
      include: {
        eventTicket: true
      },
      orderBy: {
        assigned_name: 'asc'
      }
    });

    if (tickets.length === 0) {
      return res.status(404).json({ error: 'No tickets found for this order' });
    }

    res.json(tickets);
  } catch (error) {
    console.error('Get order tickets error:', error);
    res.status(500).json({ error: 'Failed to get order tickets' });
  }
};