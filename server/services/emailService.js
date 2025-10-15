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
  tickets, // Array of individual tickets with QR codes
  orderId,
  totalAmount,
  subtotal,
  serviceFee,
  processingFee,
}) => {
  try {
    
    const subject = `You're going to ${eventName}!`;
    
    // Group tickets by type for the order summary
    const ticketGroups = tickets.reduce((groups, ticket) => {
      // Extract base type (remove the " - Name" part)
      const baseType = ticket.type.split(' - ')[0];
      if (!groups[baseType]) {
        groups[baseType] = {
          type: baseType,
          price: ticket.price,
          count: 0
        };
      }
      groups[baseType].count++;
      return groups;
    }, {});
    
    // Build individual ticket cards
    const ticketCards = tickets.map((ticket, index) => `
      <div style="background: white; border: 1px solid #e6e6e6; border-radius: 8px; padding: 24px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
          <div>
            <h3 style="margin: 0 0 8px 0; color: #282c34; font-size: 18px; font-weight: 600;">${ticket.type}</h3>
            <p style="margin: 0; color: #6f7287; font-size: 14px;">$${ticket.price.toFixed(2)}</p>
          </div>
        </div>
        
        ${ticket.qrCode ? `
          <div style="text-align: center; padding: 20px 0; background: #f8f8f8; border-radius: 6px; margin: 16px 0;">
            <img src="cid:qrcode${index}" alt="QR Code" style="max-width: 200px; width: 100%;" />
            <p style="margin: 12px 0 0 0; color: #6f7287; font-size: 12px;">Show this QR code at entry</p>
          </div>
        ` : ''}
      </div>
    `).join('');
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.5; 
            color: #282c34; 
            margin: 0; 
            padding: 0;
            background-color: #f5f5f5;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #f5f5f5;
          }
          .header { 
            background-color: #282c34;
            padding: 32px 24px;
            text-align: center;
          }
          .header h1 { 
            margin: 0 0 8px 0; 
            font-size: 24px;
            font-weight: 700;
            color: white;
          }
          .order-id-header {
            color: #9ca3af;
            font-size: 14px;
            margin: 0;
          }
          .content { 
            padding: 32px 24px;
          }
          .success-badge {
            background-color: #fd4300;
            color: white;
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 16px;
          }
          .event-details { 
            background: white;
            border: 1px solid #e6e6e6;
            border-radius: 8px;
            padding: 24px;
            margin-bottom: 24px;
          }
          .event-details h2 { 
            margin: 0 0 16px 0;
            color: #282c34;
            font-size: 22px;
            font-weight: 700;
          }
          .detail-row {
            display: flex;
            align-items: start;
            margin-bottom: 12px;
            color: #282c34;
          }
          .detail-row:last-child {
            margin-bottom: 0;
          }
          .detail-icon {
            margin-right: 12px;
            font-size: 18px;
            color: #fd4300;
          }
          .detail-text {
            flex: 1;
          }
          .detail-label {
            font-size: 12px;
            color: #6f7287;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .detail-value {
            font-size: 16px;
            color: #282c34;
            font-weight: 500;
          }
          .section-title {
            font-size: 18px;
            font-weight: 700;
            color: #282c34;
            margin: 32px 0 16px 0;
          }
          .order-summary {
            background: white;
            border: 1px solid #e6e6e6;
            border-radius: 8px;
            padding: 24px;
            margin-top: 24px;
          }
          .summary-row {
            display: table;
            width: 100%;
            margin-bottom: 12px;
            font-size: 15px;
            color: #282c34;
          }
          .summary-row .label {
            display: table-cell;
            text-align: left;
            padding-right: 16px;
          }
          .summary-row .amount {
            display: table-cell;
            text-align: right;
            font-weight: 500;
            white-space: nowrap;
          }
          .ticket-detail {
            font-size: 13px;
            color: #6f7287;
            margin: 4px 0 16px 0;
          }
          .summary-divider {
            border-top: 1px solid #e6e6e6;
            margin: 16px 0;
          }
          .summary-row.subtotal {
            font-weight: 600;
            padding-top: 12px;
          }
          .summary-row.total {
            border-top: 2px solid #e6e6e6;
            padding-top: 16px;
            margin-top: 16px;
            font-size: 18px;
            font-weight: 700;
            color: #282c34;
          }
          .order-id {
            background: #f8f8f8;
            padding: 12px 16px;
            border-radius: 6px;
            margin-top: 16px;
            font-size: 13px;
            color: #6f7287;
            text-align: center;
          }
          .info-box {
            background: #fff4e6;
            border-left: 4px solid #fd4300;
            padding: 16px;
            border-radius: 4px;
            margin: 24px 0;
          }
          .info-box p {
            margin: 0;
            color: #282c34;
            font-size: 14px;
            line-height: 1.6;
          }
          .footer { 
            text-align: center;
            padding: 32px 24px;
            color: #6f7287;
            font-size: 13px;
            line-height: 1.6;
          }
          .footer-links {
            margin-top: 16px;
          }
          .footer-links a {
            color: #fd4300;
            text-decoration: none;
            margin: 0 8px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Chinmaya Vrindavan Events</h1>
            <p class="order-id-header">Order #${orderId}</p>
          </div>
          
          <div class="content">
            <div style="text-align: center;">
              <span class="success-badge">✓ Registration Confirmed</span>
            </div>
            
            <div class="event-details">
              <h2>${eventName}</h2>
              
              <div class="detail-row">
                <span class="detail-icon">📅</span>
                <div class="detail-text">
                  <div class="detail-label">When</div>
                  <div class="detail-value">${eventDate}</div>
                </div>
              </div>
              
              <div class="detail-row">
                <span class="detail-icon">📍</span>
                <div class="detail-text">
                  <div class="detail-label">Where</div>
                  <div class="detail-value">${eventLocation}</div>
                </div>
              </div>
            </div>

            <div class="info-box">
              <p><strong>Important:</strong> Please bring your ticket QR code(s) below. You can show this email or save the QR codes to your phone.</p>
            </div>

            <h3 class="section-title">Your Tickets</h3>
            ${ticketCards}

            <div class="order-summary">
              <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 700; color: #282c34;">Order Summary</h3>
              
              ${Object.values(ticketGroups).map(group => `
                <div style="margin-bottom: 16px;">
                  <div class="summary-row">
                    <span class="label">${group.count}x ${group.type}</span>
                    <span class="amount">$${(group.count * group.price).toFixed(2)}</span>
                  </div>
                  <div class="ticket-detail">$${group.price.toFixed(2)} each</div>
                </div>
              `).join('')}
              
              <div class="summary-divider"></div>
              
              <div class="summary-row subtotal">
                <span class="label">Subtotal</span>
                <span class="amount">$${subtotal}</span>
              </div>
              
              <div class="summary-row">
                <span class="label">Service Fee</span>
                <span class="amount">$${serviceFee.toFixed(2)}</span>
              </div>
              
              <div class="summary-row">
                <span class="label">Processing Fee</span>
                <span class="amount">$${processingFee.toFixed(2)}</span>
              </div>
              
              <div class="summary-row total">
                <span class="label">Total</span>
                <span class="amount">$${totalAmount.toFixed(2)}</span>
              </div>
              
              <div class="order-id">
                Order ID: ${orderId}
              </div>
            </div>

            <p style="margin-top: 32px; text-align: center; color: #282c34; font-size: 15px;">
              We're looking forward to seeing you at the event!
            </p>
          </div>
          
          <div class="footer">
            <p>This is an automated confirmation email.</p>
            <p>Questions? Contact us at <a href="mailto:support@chinmayaevents.com" style="color: #fd4300;">support@chinmayaevents.com</a></p>
            <div class="footer-links">
              <a href="#">View Event</a> • <a href="#">Get Help</a>
            </div>
            <p style="margin-top: 24px; font-size: 12px;">© 2025 Chinmaya Events. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Prepare attachments for QR codes
    const attachments = tickets
      .filter(ticket => ticket.qrCode)
      .map((ticket, index) => ({
        filename: `ticket-qr-${index + 1}.png`,
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
    throw error;
  }
};

export default sendTicketConfirmation;