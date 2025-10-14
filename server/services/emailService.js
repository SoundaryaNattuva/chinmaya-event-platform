import nodemailer from 'nodemailer';

// Create the transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false, // false for port 587 (TLS)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify transporter configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter verification failed:', error);
  } else {
    console.log('Email service is ready to send messages');
  }
});

// Send ticket confirmation email with receipt + QR codes + event details
export const sendTicketConfirmation = async ({
  to,
  customerName,
  eventName,
  eventDate,
  eventLocation,
  tickets, // Array of tickets
  totalAmount,
  orderId,
}) => {
  try {
    const subject = `Your Tickets for ${eventName} - Order #${orderId}`;
    
    // Build ticket details HTML
    const ticketRows = tickets.map((ticket, index) => `
      <div style="border-bottom: 1px solid #ddd; padding: 15px 0;">
        <h4 style="margin: 0 0 10px 0;">${ticket.type}</h4>
        <p style="margin: 5px 0;"><strong>Quantity:</strong> ${ticket.quantity}</p>
        <p style="margin: 5px 0;"><strong>Price:</strong> $${ticket.price} each</p>
        <p style="margin: 5px 0;"><strong>Subtotal:</strong> $${(ticket.quantity * ticket.price).toFixed(2)}</p>
        ${ticket.qrCode ? `
          <div style="margin-top: 15px; text-align: center;">
            <p style="margin: 5px 0;"><strong>QR Code for ${ticket.type}:</strong></p>
            <img src="cid:qrcode${index}" alt="QR Code" style="max-width: 250px; border: 2px solid #4CAF50; padding: 10px;" />
          </div>
        ` : ''}
      </div>
    `).join('');
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 0; }
          .header { background-color: #4CAF50; color: white; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 30px 20px; background-color: #f9f9f9; }
          .event-info { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .event-info h2 { margin-top: 0; color: #4CAF50; }
          .tickets-section { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .total { background-color: #4CAF50; color: white; padding: 15px; text-align: center; font-size: 20px; font-weight: bold; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background-color: #f0f0f0; }
          .order-id { color: #666; font-size: 14px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎟️ Ticket Confirmation</h1>
            <p class="order-id">Order #${orderId}</p>
          </div>
          
          <div class="content">
            <p>Dear ${customerName},</p>
            <p>Thank you for your purchase! Your tickets have been confirmed.</p>
            
            <div class="event-info">
              <h2>${eventName}</h2>
              <p><strong>📅 Date:</strong> ${eventDate}</p>
              <p><strong>📍 Location:</strong> ${eventLocation}</p>
            </div>

            <div class="tickets-section">
              <h3 style="margin-top: 0;">Your Tickets:</h3>
              ${ticketRows}
            </div>

            <div class="total">
              Total Amount Paid: $${totalAmount}
            </div>

            <p style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
              <strong>📱 Important:</strong> Please show the QR code(s) above at the event entrance for check-in.
            </p>

            <p>We look forward to seeing you at the event!</p>
            <p>Best regards,<br><strong>Chinmaya Events Team</strong></p>
          </div>
          
          <div class="footer">
            <p>This is an automated email confirmation. Please do not reply to this message.</p>
            <p>If you have any questions, please contact us at support@chinmayaevents.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Prepare attachments for QR codes
    const attachments = tickets
      .filter(ticket => ticket.qrCode)
      .map((ticket, index) => ({
        filename: `qrcode-${ticket.type.replace(/\s+/g, '-').toLowerCase()}.png`,
        content: ticket.qrCode,
        cid: `qrcode${index}`,
      }));

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Ticket confirmation email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('Error sending ticket confirmation email:', error);
    throw new Error(`Failed to send ticket confirmation: ${error.message}`);
  }
};

export default sendTicketConfirmation;