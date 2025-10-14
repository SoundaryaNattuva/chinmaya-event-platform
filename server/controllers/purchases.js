import prisma from '../lib/prisma.js';
import crypto from 'crypto';

export const processPurchase = async (req, res) => {
  try {
    const { 
      eventId, 
      purchaserInfo, 
      ticketHolders, 
      selectedTickets, 
      totalAmount 
    } = req.body;

    console.log('Processing purchase:', { eventId, purchaserInfo, ticketHolders, selectedTickets });

    // Validate required fields
    if (!eventId || !purchaserInfo || !selectedTickets || !totalAmount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      const purchasedTickets = [];

      // Process each ticket type
      for (const selectedTicket of selectedTickets) {
        // Get the EventTicket info
        const eventTicket = await tx.eventTicket.findUnique({
          where: { id: selectedTicket.id },
          include: {
            _count: {
              select: { purchasedTickets: true }
            }
          }
        });

        if (!eventTicket) {
          throw new Error(`Ticket type with ID ${selectedTicket.id} not found`);
        }

        // Check if enough tickets available
        const soldCount = eventTicket._count.purchasedTickets;
        const available = eventTicket.quantity - soldCount;
        
        console.log(`Ticket ${selectedTicket.type}: ${available} available (${eventTicket.quantity} total, ${soldCount} sold)`);
        
        if (available < selectedTicket.quantity) {
          throw new Error(`Not enough ${selectedTicket.type} tickets available. Only ${available} left.`);
        }

        // Get ticket holders for this ticket type
        const holdersForThisType = ticketHolders.filter(h => h.type === selectedTicket.type);
        
        console.log(`Creating ${holdersForThisType.length} tickets for ${selectedTicket.type}`);
        
        if (holdersForThisType.length !== selectedTicket.quantity) {
          throw new Error(`Mismatch: expected ${selectedTicket.quantity} holders for ${selectedTicket.type}, got ${holdersForThisType.length}`);
        }

        // Create individual PurchasedTicket records for each holder
        for (const holder of holdersForThisType) {
          const qrCode = `QR_${Date.now()}_${crypto.randomUUID().replace(/-/g, '').substring(0, 9)}`;
          
          const purchasedTicket = await tx.purchasedTicket.create({
            data: {
              event_id: eventId,
              event_ticket_id: selectedTicket.id,
              purchaser_name: `${purchaserInfo.firstName} ${purchaserInfo.lastName}`,
              purchaser_email: purchaserInfo.email,
              purchaser_phone: purchaserInfo.phone,
              assigned_name: `${holder.firstName} ${holder.lastName}`,
              qr_code: qrCode,
              item: eventTicket.includes_item,
              checked_in: false,
              item_collected: false
            }
          });
          
          purchasedTickets.push(purchasedTicket);
          console.log(`Created ticket for ${holder.firstName} ${holder.lastName} with QR: ${qrCode}`);
        }
      }

      return { 
        tickets: purchasedTickets,
        totalTickets: purchasedTickets.length 
      };
    });

    console.log('✅ Purchase successful! Created', result.totalTickets, 'tickets');
       res.json({ 
      success: true, 
      message: 'Purchase completed successfully',
      totalTickets: result.totalTickets,
      purchaseId: result.tickets[0]?.id // Return first ticket ID as reference
    });

  } catch (error) {
    console.error('❌ Purchase processing error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};
