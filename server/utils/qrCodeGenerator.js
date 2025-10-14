import QRCode from 'qrcode';

/**
 * Generate QR code as buffer (for email attachment)
 * @param {string} data - The data to encode (QR code string)
 * @returns {Promise<Buffer>} - QR code image as buffer
 */
export const generateQRCodeBuffer = async (data) => {
  try {
    const buffer = await QRCode.toBuffer(data, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return buffer;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

/**
 * Generate multiple QR codes for tickets
 * @param {Array} tickets - Array of ticket objects with qr_code field
 * @returns {Promise<Array>} - Array of buffers
 */
export const generateQRCodesForTickets = async (tickets) => {
  try {
    const qrCodePromises = tickets.map(ticket => 
      generateQRCodeBuffer(ticket.qr_code)
    );
    return await Promise.all(qrCodePromises);
  } catch (error) {
    console.error('Error generating QR codes for tickets:', error);
    throw error;
  }
};