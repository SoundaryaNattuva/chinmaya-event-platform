const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const processPurchase = async (req, res) => {
  try {
    const { 
      eventId, 
      purchaserInfo, 
      ticketHolders, 
      selectedTickets, 
      totalAmount 
    } = req.body;

    // Validate required fields
    if (!eventId || !purchaserInfo || !selectedTickets || !totalAmount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the purchase record
      const purchase = await tx.purchase.create({
        data: {
          event_id: parseInt(eventId),
          purchaser_email: purchaserInfo.email,
          purchaser_first_name: purchaserInfo.firstName,
          purchaser_last_name: purchaserInfo.lastName,
          purchaser_phone: purchaserInfo.phone,
          total_amount: totalAmount,
          status: 'COMPLETED'
        }
      });

      // 2. Update ticket inventory and create ticket records
      for (const ticket of selectedTickets) {
        const ticketType = await tx.ticketType.findUnique({
          where: { id: parseInt(ticket.id) }
        });

        // Check if ticket type exists
        if (!ticketType) {
          throw new Error(`Ticket type with ID ${ticket.id} not found`);
        }

        // Check if enough tickets available
        if (ticketType.available < ticket.quantity) {
          throw new Error(`Not enough ${ticket.type} tickets available`);
        }

        // Update ticket counts
        await tx.ticketType.update({
          where: { id: parseInt(ticket.id) },
          data: {
            sold: ticketType.sold + ticket.quantity,
            available: ticketType.available - ticket.quantity
          }
        });

        // Create individual ticket records for each ticket holder
        const holdersForThisType = ticketHolders.filter(h => h.type === ticket.type);
        for (const holder of holdersForThisType) {
          await tx.ticket.create({
            data: {
              purchase_id: purchase.id,
              ticket_type_id: parseInt(ticket.id),
              holder_first_name: holder.firstName,
              holder_last_name: holder.lastName,
              status: 'ACTIVE'
            }
          });
        }
      }

      return purchase;
    });

    res.json({ 
      success: true, 
      purchaseId: result.id,
      message: 'Purchase completed successfully' 
    });

  } catch (error) {
    console.error('Purchase processing error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

module.exports = {
  processPurchase
};