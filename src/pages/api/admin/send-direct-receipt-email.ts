import type { NextApiRequest, NextApiResponse } from 'next';
import PDFDocument from 'pdfkit';
import path from 'path';
import { sendDirectReceiptEmail } from '@/services/emailService';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: { sizeLimit: '2mb' },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const {
    projectName,
    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    amount,
    paymentMode,
    serviceType,
    description,
    receiptNumber, // Add this line to extract receiptNumber from request body
  } = req.body;

  const address = (customerAddress || '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  // Use the provided receiptNumber or generate a new one if not provided
  const finalReceiptNumber = receiptNumber || `AKX-${Date.now().toString().slice(-8)}`;
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Create PDF with explicit page size and auto-page break disabled
  const doc = new PDFDocument({ 
    size: 'A4', 
    margin: 0,
    autoFirstPage: true,
    bufferPages: true
  });
  
  let buffers: Buffer[] = [];
  doc.on('data', buffers.push.bind(buffers));
  // Create a promise to handle the PDF generation completion
  const pdfGenerationComplete = new Promise<Buffer>((resolve) => {
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
  });
  
  try {
    console.log('SMTP settings:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER ? 'Set' : 'Not set',
      pass: process.env.SMTP_PASS ? 'Set' : 'Not set'
    });
  } catch (error: any) {
    console.error('Failed to send receipt email:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to send receipt email', 
      error: error.message 
    });
  }

  // **ULTRA PREMIUM HEADER DESIGN**
  // Enhanced gradient background with more vibrant colors
  const headerGradient = doc.linearGradient(0, 0, doc.page.width, 0);
  headerGradient.stop(0, '#1e3a8a').stop(0.2, '#3730a3').stop(0.5, '#7c3aed').stop(0.8, '#a855f7').stop(1, '#c026d3');
  doc.save().rect(0, 0, doc.page.width, 150).fill(headerGradient).restore();

  // Add subtle pattern overlay to the header
  doc.save();
  doc.fillColor('#ffffff').opacity(0.03);
  for (let i = 0; i < 20; i++) {
    for (let j = 0; j < 10; j++) {
      doc.circle(i * 30, j * 30, 2).fill();
    }
  }
  doc.restore();

  // Elegant double border accent
  doc.rect(0, 145, doc.page.width, 5).fill('#fbbf24');
  doc.rect(0, 142, doc.page.width, 1).fill('#ffffff').opacity(0.3);

  // Premium logo placement with enhanced shadow effect
  try {
    const logoPath = path.join(process.cwd(), 'public', 'akrix-logo.png');
    // Enhanced shadow effect with multiple layers
    doc.save();
    doc.fillColor('#000000').opacity(0.08);
    doc.circle(doc.page.width / 2 + 4, 54, 38).fill();
    doc.fillColor('#000000').opacity(0.12);
    doc.circle(doc.page.width / 2 + 2, 52, 35).fill();
    doc.restore();
    // Logo with slight rotation for dynamic effect
    doc.save();
    doc.translate(doc.page.width / 2, 55);
    doc.rotate(2);
    doc.image(logoPath, -35, -35, { width: 70 });
    doc.restore();
  } catch (error) {
    // Fallback if logo not found with enhanced styling
    doc.save();
    doc.translate(doc.page.width / 2, 55);
    doc.rotate(2);
    doc.fontSize(28).fillColor('#ffffff').font('Helvetica-Bold')
       .text('AKRIX', -40, -10, { align: 'center' });
    doc.restore();
  }

  // Elegant title with premium styling and subtle shadow
  doc.save();
  doc.fillColor('#000000').opacity(0.2);
  doc.fontSize(34).font('Helvetica-Bold')
     .text('PAYMENT RECEIPT', 2, 102, { align: 'center' });
  doc.restore();
  
  doc.fontSize(34).fillColor('#ffffff').font('Helvetica-Bold')
     .text('PAYMENT RECEIPT', 0, 100, { align: 'center' });
     
  // Add subtle decorative elements
  doc.save();
  doc.strokeColor('#fbbf24').lineWidth(2);
  doc.moveTo(doc.page.width / 2 - 100, 138).lineTo(doc.page.width / 2 + 100, 138).stroke();
  doc.restore();

  // **PREMIUM CONTENT SECTION**
  let yPosition = 190;

  // Receipt info header with enhanced luxury styling
  // Add shadow effect for the receipt info box
  doc.save();
  doc.fillColor('#000000').opacity(0.05);
  doc.roundedRect(46, yPosition - 6, doc.page.width - 92, 60, 8).fill();
  doc.fillColor('#000000').opacity(0.03);
  doc.roundedRect(43, yPosition - 3, doc.page.width - 86, 60, 8).fill();
  doc.restore();
  
  // Main receipt info box with subtle gradient
  const receiptInfoGradient = doc.linearGradient(40, yPosition - 10, doc.page.width - 40, yPosition + 50);
  receiptInfoGradient.stop(0, '#f8fafc').stop(0.5, '#f1f5f9').stop(1, '#e2e8f0');
  doc.roundedRect(40, yPosition - 10, doc.page.width - 80, 60, 8).fill(receiptInfoGradient);
  
  // Add a subtle gold border
  doc.save();
  doc.strokeColor('#fbbf24').opacity(0.4).lineWidth(1);
  doc.roundedRect(40, yPosition - 10, doc.page.width - 80, 60, 8).stroke();
  doc.restore();
  
  // Add decorative elements
  doc.save();
  doc.fillColor('#7c3aed').opacity(0.1);
  doc.circle(60, yPosition + 20, 15).fill();
  doc.circle(doc.page.width - 60, yPosition + 20, 10).fill();
  doc.restore();
  
  // Receipt number with enhanced styling
  doc.save();
  doc.fillColor('#1e293b').opacity(0.8);
  doc.fontSize(12).font('Helvetica-Bold')
    .text('Receipt Number:', 60, yPosition, { continued: true })
    .font('Helvetica')
    .text(` ${finalReceiptNumber}`, { align: 'left' });
  doc.restore();
  
  // Date with enhanced styling
  doc.save();
  doc.fillColor('#1e293b').opacity(0.8);
  doc.fontSize(12).font('Helvetica-Bold')
    .text('Date:', doc.page.width - 180, yPosition, { continued: true })
    .font('Helvetica')
    .text(` ${currentDate}`, { align: 'left' });
  doc.restore();
  
  yPosition += 30;
  
  // Project name with enhanced styling
  if (projectName) {
    doc.save();
    doc.fillColor('#1e293b').opacity(0.8);
    doc.fontSize(12).font('Helvetica-Bold')
      .text('Project:', 60, yPosition, { continued: true })
      .font('Helvetica')
      .text(` ${projectName}`, { align: 'left' });
    doc.restore();
  }
  
  // Service type with enhanced styling
  if (serviceType) {
    doc.save();
    doc.fillColor('#1e293b').opacity(0.8);
    doc.fontSize(12).font('Helvetica-Bold')
      .text('Service:', doc.page.width - 180, yPosition, { continued: true })
      .font('Helvetica')
      .text(` ${serviceType}`, { align: 'left' });
    doc.restore();
  }
  
  yPosition += 50;

  // Add a subtle separator
  doc.save();
  doc.strokeColor('#e2e8f0').lineWidth(1);
  doc.moveTo(doc.page.width / 2 - 20, yPosition).lineTo(doc.page.width / 2 - 20, yPosition + 40).stroke();
  doc.restore();
  
  // Date with enhanced styling
  doc.fontSize(12).fillColor('#6366f1').font('Helvetica-Bold')
     .text('Date Issued:', 300, yPosition);
  doc.fontSize(14).fillColor('#1e293b').font('Helvetica-Bold')
     .text(currentDate, 300, yPosition + 20);

  yPosition += 90;

  // **CUSTOMER INFORMATION SECTION**
  // Section header with gradient
  const customerHeaderGradient = doc.linearGradient(40, yPosition, doc.page.width - 40, yPosition + 40);
  customerHeaderGradient.stop(0, '#4f46e5').stop(0.5, '#6366f1').stop(1, '#818cf8');
  doc.roundedRect(40, yPosition, doc.page.width - 80, 40, 8).fill(customerHeaderGradient);
  
  // Add a subtle pattern to the header
  doc.save();
  doc.fillColor('#ffffff').opacity(0.1);
  for (let i = 0; i < 15; i++) {
    doc.circle(60 + (i * 40), yPosition + 20, 5).fill();
  }
  doc.restore();
  
  // Add decorative elements to the header
  doc.save();
  doc.strokeColor('#ffffff').opacity(0.3).lineWidth(1.5);
  doc.roundedRect(45, yPosition + 5, doc.page.width - 90, 30, 5).stroke();
  doc.restore();
  
  // Add header text with enhanced styling and subtle shadow
  doc.save();
  doc.fillColor('#000000').opacity(0.2);
  doc.fontSize(18).font('Helvetica-Bold')
    .text('CUSTOMER DETAILS', 62, yPosition + 12);
  doc.restore();
  
  doc.fontSize(18).fillColor('#ffffff').font('Helvetica-Bold')
    .text('CUSTOMER DETAILS', 60, yPosition + 10);

  yPosition += 55;

  // Enhanced customer details with better styling
  const customerDetails = [
    { label: 'Name', value: customerName },
    { label: 'Email', value: customerEmail },
    { label: 'Phone', value: customerPhone || 'N/A' },
    { label: 'Address', value: address || 'N/A' }
  ];
  
  // Create a more elegant customer details box with shadow effect
  doc.save();
  doc.fillColor('#000000').opacity(0.03);
  doc.roundedRect(46, yPosition - 6, doc.page.width - 92, 100, 8).fill();
  doc.restore();
  
  // Main customer details box with subtle gradient
  const customerBoxGradient = doc.linearGradient(40, yPosition - 10, doc.page.width - 40, yPosition + 100);
  customerBoxGradient.stop(0, '#f8fafc').stop(0.5, '#f1f5f9').stop(1, '#e2e8f0');
  doc.roundedRect(40, yPosition - 10, doc.page.width - 80, 100, 8).fill(customerBoxGradient);
  
  // Add a subtle border
  doc.save();
  doc.strokeColor('#cbd5e1').opacity(0.6).lineWidth(1);
  doc.roundedRect(40, yPosition - 10, doc.page.width - 80, 100, 8).stroke();
  doc.restore();
  
  // Add customer details with alternating row backgrounds
  customerDetails.forEach((detail, index) => {
    // Add subtle alternating row background
    if (index % 2 === 1) {
      doc.save();
      doc.fillColor('#f1f5f9').opacity(0.5);
      doc.rect(50, yPosition + (index * 22), doc.page.width - 100, 20).fill();
      doc.restore();
    }
    
    // Add label with enhanced styling
    doc.save();
    doc.fillColor('#1e293b').opacity(0.8);
    doc.fontSize(12).font('Helvetica-Bold')
      .text(`${detail.label}:`, 60, yPosition + (index * 22), { continued: true })
      .font('Helvetica')
      .text(` ${detail.value}`, { align: 'left' });
    doc.restore();
  });
  
  yPosition += 120;
  
  // Add a background for the entire details section with rounded corners
  const detailsHeight = customerDetails.length * 35;
  doc.roundedRect(40, yPosition, doc.page.width - 80, detailsHeight, 8).fill('#ffffff').stroke('#e2e8f0');
  
  customerDetails.forEach((detail, index) => {
    const rowY = yPosition + (index * 35);
    
    // Alternating row backgrounds with rounded corners for inner rows
    if (index % 2 !== 0) {
      doc.save();
      if (index === customerDetails.length - 1) {
        // Last row with bottom rounded corners
        doc.roundedRect(40, rowY, doc.page.width - 80, 35, { bottomLeft: 8, bottomRight: 8 }).fill('#f8fafc');
      } else {
        // Middle rows without rounded corners
        doc.rect(40, rowY, doc.page.width - 80, 35).fill('#f8fafc');
      }
      doc.restore();
    }
    
    // Label with accent color and improved styling
    doc.fontSize(12).fillColor('#6366f1').font('Helvetica-Bold')
      .text(`${detail.label}:`, 60, rowY + 12);
      
    // Value with better typography
    doc.fontSize(12).fillColor('#1f2937').font('Helvetica')
      .text(detail.value, 200, rowY + 12, { width: 300 });
      
    // Add a subtle separator line except for the last item
    if (index < customerDetails.length - 1) {
      doc.strokeColor('#e2e8f0').moveTo(60, rowY + 35).lineTo(doc.page.width - 60, rowY + 35).stroke();
    }
  });
  
  yPosition += detailsHeight + 15;

  // Premium amount box with ultra-enhanced design
  const amountBoxHeight = 100; // Reduced height
  
  // Add shadow effect for the amount box
  doc.save();
  doc.fillColor('#000000').opacity(0.1);
  doc.roundedRect(45, yPosition + 5, doc.page.width - 90, amountBoxHeight, 10).fill();
  doc.restore();
  
  // Create a more vibrant gradient for the amount box with multiple color stops
  const amountBoxGradient = doc.linearGradient(40, yPosition, doc.page.width - 40, yPosition + amountBoxHeight);
  amountBoxGradient.stop(0, '#047857').stop(0.3, '#059669').stop(0.7, '#10b981').stop(1, '#34d399');
  
  // Draw the main box with rounded corners
  doc.roundedRect(40, yPosition, doc.page.width - 80, amountBoxHeight, 12).fill(amountBoxGradient);
  
  // Add a subtle gold border
  doc.save();
  doc.strokeColor('#fbbf24').opacity(0.6).lineWidth(1.5);
  doc.roundedRect(40, yPosition, doc.page.width - 80, amountBoxHeight, 12).stroke();
  doc.restore();
  
  // Add decorative elements with more sophisticated patterns
  doc.save();
  // Left side decorative circles
  doc.fillColor('#ffffff').opacity(0.1);
  doc.circle(80, yPosition + 25, 30).fill();
  doc.circle(80, yPosition + 25, 20).fill();
  doc.circle(80, yPosition + 25, 15).fill();
  
  // Right side decorative elements
  doc.circle(doc.page.width - 100, yPosition + amountBoxHeight - 25, 20).fill();
  doc.circle(doc.page.width - 100, yPosition + amountBoxHeight - 25, 12).fill();
  
  // Add some small dots for texture
  for (let i = 0; i < 20; i++) {
    doc.circle(60 + (i * 25), yPosition + amountBoxHeight - 12, 2).fill();
  }
  doc.restore();
  
  // Add a subtle border accent with double lines
  doc.save();
  doc.strokeColor('#ffffff').opacity(0.4).lineWidth(2);
  doc.roundedRect(50, yPosition + 8, doc.page.width - 100, amountBoxHeight - 16, 8).stroke();
  doc.strokeColor('#ffffff').opacity(0.2).lineWidth(1);
  doc.roundedRect(55, yPosition + 12, doc.page.width - 110, amountBoxHeight - 24, 6).stroke();
  doc.restore();
  
  // Amount label with enhanced styling and subtle shadow
  doc.save();
  doc.fillColor('#000000').opacity(0.2);
  doc.fontSize(16).font('Helvetica-Bold')
    .text('TOTAL AMOUNT', 62, yPosition + 22, { align: 'left' });
  doc.restore();
  
  doc.fontSize(16).fillColor('#ffffff').font('Helvetica-Bold')
    .text('TOTAL AMOUNT', 60, yPosition + 20, { align: 'left' });
  
  // Amount value with currency symbol and larger font with subtle shadow
  doc.save();
  doc.fillColor('#000000').opacity(0.2);
  doc.fontSize(36).font('Helvetica-Bold')
    .text(`₹${parseFloat(amount).toLocaleString('en-IN')}`, 62, yPosition + 42, { align: 'left' });
  doc.restore();
  
  doc.fontSize(36).fillColor('#ffffff').font('Helvetica-Bold')
    .text(`₹${parseFloat(amount).toLocaleString('en-IN')}`, 60, yPosition + 40, { align: 'left' });
  
  // Add payment method with enhanced styling
  doc.save();
  // Add a subtle divider
  doc.strokeColor('#ffffff').opacity(0.3).lineWidth(1);
  doc.moveTo(doc.page.width / 2, yPosition + 25).lineTo(doc.page.width / 2, yPosition + amountBoxHeight - 25).stroke();
  doc.restore();
  
  // Payment method value with enhanced styling
  doc.fontSize(16).fillColor('#ffffff').font('Helvetica-Bold')
    .text(`Payment: ${paymentMode}`, doc.page.width / 2 + 30, yPosition + 40);
  
  yPosition += amountBoxHeight + 15;

  // Digital stamp: centered, below green box, above footer
  try {
    const digitalStampPath = path.join(process.cwd(), 'public', 'digital.png');
    const stampWidth = 120;
    const stampHeight = 120;
    const stampX = (doc.page.width - stampWidth) / 2;
    const stampY = yPosition + 10;
    doc.save();
    doc.opacity(0.6);
    doc.image(digitalStampPath, stampX, stampY, { width: stampWidth, height: stampHeight });
    doc.restore();
  } catch (e) {}
  yPosition += 140;

  // **ULTRA PREMIUM DESCRIPTION SECTION
  // Add a subtle shadow effect for the description section
  doc.save();
  doc.fillColor('#000000').opacity(0.05);
  doc.roundedRect(45, yPosition + 5, doc.page.width - 90, 80, 10).fill();
  doc.restore();
  
  // Create a more vibrant gradient for the description header
  const descriptionHeaderGradient = doc.linearGradient(40, yPosition, doc.page.width - 40, yPosition + 30);
  descriptionHeaderGradient.stop(0, '#4f46e5').stop(0.5, '#6366f1').stop(1, '#818cf8');
  
  // Draw the header with rounded top corners
  doc.save();
  doc.path(`M 40 ${yPosition + 10} 
           C 40 ${yPosition + 4} 46 ${yPosition} 52 ${yPosition} 
           L ${doc.page.width - 52} ${yPosition} 
           C ${doc.page.width - 46} ${yPosition} ${doc.page.width - 40} ${yPosition + 4} ${doc.page.width - 40} ${yPosition + 10} 
           L ${doc.page.width - 40} ${yPosition + 30} 
           L 40 ${yPosition + 30} 
           Z`)
    .fill(descriptionHeaderGradient);
  doc.restore();
  
  // Add decorative patterns to the header
  doc.save();
  doc.fillColor('#ffffff').opacity(0.1);
  for (let i = 0; i < 10; i++) {
    doc.circle(60 + (i * 50), yPosition + 15, 5).fill();
  }
  doc.restore();
  
  // Add header text with enhanced styling
  doc.save();
  doc.fillColor('#000000').opacity(0.2);
  doc.fontSize(14).font('Helvetica-Bold')
    .text('DESCRIPTION', doc.page.width / 2 + 2, yPosition + 9, { align: 'center' });
  doc.restore();
  
  doc.fontSize(14).fillColor('#ffffff').font('Helvetica-Bold')
    .text('DESCRIPTION', doc.page.width / 2, yPosition + 7, { align: 'center' });
  
  // Draw the content box with shadow effect and subtle gold border
  doc.save();
  doc.fillColor('#ffffff');
  doc.roundedRect(40, yPosition + 30, doc.page.width - 80, 50, { bottomLeft: 10, bottomRight: 10 }).fill();
  doc.strokeColor('#fbbf24').opacity(0.3).lineWidth(1);
  doc.roundedRect(40, yPosition + 30, doc.page.width - 80, 50, { bottomLeft: 10, bottomRight: 10 }).stroke();
  doc.restore();
  
  // Add description text with enhanced styling
  doc.fontSize(11).fillColor('#333333').font('Helvetica')
    .text('Payment received for services rendered. Thank you for your business.', 60, yPosition + 45, { width: doc.page.width - 120, align: 'center' });
  
  yPosition += 90; // Reduced spacing

  // ULTRA PREMIUM FOOTER DESIGN
  // Calculate footer position to ensure it stays on the first page
  const footerYPosition = Math.min(yPosition, doc.page.height - 130);
  
  // Add shadow effect for the footer
  doc.save();
  doc.fillColor('#000000').opacity(0.1);
  doc.rect(0, footerYPosition + 5, doc.page.width, 125).fill();
  doc.restore();
  
  // Create a more vibrant gradient for the footer
  const footerGradient = doc.linearGradient(0, footerYPosition, 0, footerYPosition + 120);
  footerGradient.stop(0, '#064e3b').stop(0.5, '#065f46').stop(1, '#047857');
  
  // Draw the footer with the gradient
  doc.rect(0, footerYPosition, doc.page.width, 120).fill(footerGradient);
  
  // Add a double gold accent line at the top of the footer
  doc.save();
  doc.strokeColor('#fbbf24').opacity(0.8).lineWidth(2);
  doc.moveTo(0, footerYPosition + 4).lineTo(doc.page.width, footerYPosition + 4).stroke();
  doc.strokeColor('#fbbf24').opacity(0.4).lineWidth(1);
  doc.moveTo(0, footerYPosition + 8).lineTo(doc.page.width, footerYPosition + 8).stroke();
  doc.restore();
  
  // Add a subtle pattern to the footer
  doc.save();
  doc.fillColor('#ffffff').opacity(0.05);
  for (let i = 0; i < 40; i++) {
    doc.circle(i * 20, footerYPosition + 60, 4).fill();
  }
  doc.restore();
  
  // Add an enhanced "Thank You" message with decorative elements
  doc.save();
  doc.fillColor('#000000').opacity(0.2);
  doc.fontSize(20).font('Helvetica-Bold')
    .text('THANK YOU FOR YOUR BUSINESS', doc.page.width / 2 + 2, footerYPosition + 22, { align: 'center' });
  doc.restore();
  
  doc.fontSize(20).fillColor('#ffffff').font('Helvetica-Bold')
    .text('THANK YOU FOR YOUR BUSINESS', doc.page.width / 2, footerYPosition + 20, { align: 'center' });
  
  // Add contact information with enhanced styling
  doc.fontSize(10).fillColor('#ffffff').opacity(0.9).font('Helvetica')
    .text('Contact: support@akrix.com | www.akrix.com', doc.page.width / 2, footerYPosition + 50, { align: 'center' });
  
  // Add social media icons (simulated with text)
  doc.save();
  doc.fillColor('#ffffff').opacity(0.8);
  doc.fontSize(8).font('Helvetica')
    .text('© 2023 Akrix. All rights reserved.', doc.page.width / 2, footerYPosition + 70, { align: 'center' });
  doc.restore();
  
  // Enhanced digital stamp - positioned to stay on first page
  const stampYPosition = Math.min(footerYPosition - 60, doc.page.height - 200);
  
  // Add shadow effect for the stamp
  doc.save();
  doc.fillColor('#000000').opacity(0.1);
  doc.circle(doc.page.width - 100, stampYPosition + 2, 42).fill();
  doc.restore();
  
  // Create a more vibrant gradient for the stamp
  const stampGradient = doc.radialGradient(doc.page.width - 100, stampYPosition, 0, doc.page.width - 100, stampYPosition, 40);
  stampGradient.stop(0, '#fef3c7').stop(0.7, '#fbbf24').stop(1, '#d97706');
  
  // Draw the stamp with the gradient
  doc.circle(doc.page.width - 100, stampYPosition, 40).fill(stampGradient);
  
  // Add a border to the stamp
  doc.save();
  doc.strokeColor('#b45309').opacity(0.8).lineWidth(2);
  doc.circle(doc.page.width - 100, stampYPosition, 40).stroke();
  doc.restore();
  
  // Add text to the stamp with enhanced styling
  doc.save();
  doc.rotate(30, { origin: [doc.page.width - 100, stampYPosition] });
  doc.fontSize(10).fillColor('#7c2d12').font('Helvetica-Bold')
    .text('PAID', doc.page.width - 100, stampYPosition - 5, { align: 'center' });
  doc.restore();
  
  // Add decorative elements to the stamp
  doc.save();
  doc.strokeColor('#b45309').opacity(0.5).lineWidth(1);
  doc.circle(doc.page.width - 100, stampYPosition, 35).stroke();
  doc.circle(doc.page.width - 100, stampYPosition, 30).stroke();
  doc.restore();
  
  // Enhanced Akrix logo watermark with subtle effects
  // Calculate logo position to ensure it stays on the first page
  const logoWidth = 200;
  const logoHeight = 100;
  const logoX = (doc.page.width - logoWidth) / 2;
  const logoY = Math.min(doc.page.height / 2 - logoHeight / 2, doc.page.height - 350);
  
  // Add shadow effect for the logo
  doc.save();
  doc.fillColor('#000000').opacity(0.03);
  doc.rect(logoX + 5, logoY + 5, logoWidth, logoHeight).fill();
  doc.restore();
  
  // Add the logo watermark with enhanced styling
  doc.save();
  doc.fillColor('#047857').opacity(0.07);
  doc.fontSize(60).font('Helvetica-Bold')
    .text('AKRIX', logoX, logoY + 20, { align: 'center', width: logoWidth });
  doc.restore();
  
  // **ENHANCED DECORATIVE ELEMENTS**
  // Corner decorations with more elegant styling
  doc.save();
  
  // Gold gradient for decorative elements
  const decorGradient = doc.linearGradient(0, 0, 20, 20);
  decorGradient.stop(0, '#fbbf24').stop(1, '#f59e0b');
  
  // Top left corner - enhanced with gradient and thicker lines
  doc.strokeColor('#fbbf24').lineWidth(2.5);
  doc.moveTo(40, 170).lineTo(70, 170).stroke();
  doc.moveTo(40, 170).lineTo(40, 200).stroke();
  
  // Add a decorative dot
  doc.fillColor('#fbbf24');
  doc.circle(40, 170, 4).fill();
  
  // Top right corner - enhanced with gradient and thicker lines
  doc.strokeColor('#fbbf24').lineWidth(2.5);
  doc.moveTo(doc.page.width - 70, 170).lineTo(doc.page.width - 40, 170).stroke();
  doc.moveTo(doc.page.width - 40, 170).lineTo(doc.page.width - 40, 200).stroke();
  
  // Add a decorative dot
  doc.fillColor('#fbbf24');
  doc.circle(doc.page.width - 40, 170, 4).fill();
  
  // Bottom left corner - new decorative element
  doc.strokeColor('#fbbf24').lineWidth(2);
  doc.moveTo(40, doc.page.height - 170).lineTo(70, doc.page.height - 170).stroke();
  doc.moveTo(40, doc.page.height - 170).lineTo(40, doc.page.height - 200).stroke();
  
  // Bottom right corner - new decorative element
  doc.strokeColor('#fbbf24').lineWidth(2);
  doc.moveTo(doc.page.width - 70, doc.page.height - 170).lineTo(doc.page.width - 40, doc.page.height - 170).stroke();
  doc.moveTo(doc.page.width - 40, doc.page.height - 170).lineTo(doc.page.width - 40, doc.page.height - 200).stroke();
  
  doc.restore();

  doc.moveDown(2); // Add extra space if needed
  
  // Finish the PDF document to trigger the 'end' event
  doc.end();
  
  // Wait for PDF generation to complete
  const pdfData = await pdfGenerationComplete;
  
  console.log('Attempting to send email to:', customerEmail);
  
  // Send email with receipt
  await sendDirectReceiptEmail(
    customerEmail,
    customerName,
    parseFloat(amount),
    pdfData,
    finalReceiptNumber,
    projectName,
    customerPhone,
    customerAddress,
    paymentMode,
    serviceType,
    description
  );
  
  console.log('Email sent successfully to:', customerEmail);
  
  // Return success response
  return res.status(200).json({ 
    success: true, 
    message: 'Receipt email sent successfully',
    receiptNumber: finalReceiptNumber
  });
}