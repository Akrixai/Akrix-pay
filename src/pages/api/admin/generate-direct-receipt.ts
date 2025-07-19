import type { NextApiRequest, NextApiResponse } from 'next';
import PDFDocument from 'pdfkit';
import path from 'path';

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
    description,
  } = req.body;

  const address = (customerAddress || '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  const receiptNumber = `AKX-${Date.now().toString().slice(-8)}`;
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const doc = new PDFDocument({ size: 'A4', margin: 0 });
  let buffers: Buffer[] = [];
  doc.on('data', buffers.push.bind(buffers));
  doc.on('end', () => {
    const pdfData = Buffer.concat(buffers);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="akrix-receipt-${receiptNumber}.pdf"`);
    res.status(200).send(pdfData);
  });

  // **LUXURIOUS HEADER DESIGN**
  // Premium gradient background
  const headerGradient = doc.linearGradient(0, 0, doc.page.width, 0);
  headerGradient.stop(0, '#1e3a8a').stop(0.3, '#3730a3').stop(0.7, '#7c3aed').stop(1, '#a855f7');
  doc.save().rect(0, 0, doc.page.width, 140).fill(headerGradient).restore();

  // Elegant border accent
  doc.rect(0, 135, doc.page.width, 5).fill('#fbbf24');

  // Premium logo placement with shadow effect
  try {
    const logoPath = path.join(process.cwd(), 'public', 'akrix-logo.png');
    // Shadow effect
    doc.save().fillColor('#000000').opacity(0.1);
    doc.circle(doc.page.width / 2 + 2, 52, 35).fill();
    doc.restore();
    // Logo
    doc.image(logoPath, doc.page.width / 2 - 35, 20, { width: 70 });
  } catch (error) {
    // Fallback if logo not found
    doc.fontSize(24).fillColor('#ffffff').font('Helvetica-Bold')
       .text('AKRIX', doc.page.width / 2 - 30, 45);
  }

  // Elegant title with premium styling
  doc.fontSize(32).fillColor('#ffffff').font('Helvetica-Bold')
     .text('PAYMENT RECEIPT', 0, 95, { align: 'center' });

  // **PREMIUM CONTENT SECTION**
  let yPosition = 180;

  // Receipt info header with luxury styling
  doc.rect(40, yPosition - 10, doc.page.width - 80, 50).fill('#f8fafc');
  doc.rect(40, yPosition - 10, doc.page.width - 80, 50).stroke('#e2e8f0');
  
  doc.fontSize(12).fillColor('#64748b').font('Helvetica')
     .text('Receipt Number:', 60, yPosition + 5)
     .text('Date Issued:', 300, yPosition + 5);
  
  doc.fontSize(14).fillColor('#1e293b').font('Helvetica-Bold')
     .text(receiptNumber, 60, yPosition + 20)
     .text(currentDate, 300, yPosition + 20);

  yPosition += 80;

  // **CUSTOMER INFORMATION SECTION**
  // Section header
  doc.rect(40, yPosition, doc.page.width - 80, 35).fill('#6366f1');
  doc.fontSize(16).fillColor('#ffffff').font('Helvetica-Bold')
     .text('CUSTOMER DETAILS', 60, yPosition + 12);

  yPosition += 50;

  // Customer details (no emoji, clean labels)
  const customerDetails = [
    { label: 'Project Name', value: projectName },
    { label: 'Full Name', value: customerName },
    { label: 'Email Address', value: customerEmail },
    { label: 'Phone Number', value: customerPhone },
    { label: 'Address', value: address }
  ];
  customerDetails.forEach((detail, index) => {
    const bgColor = index % 2 === 0 ? '#ffffff' : '#f8fafc';
    doc.rect(40, yPosition, doc.page.width - 80, 30).fill(bgColor).stroke('#e2e8f0');
    doc.fontSize(12).fillColor('#6b7280').font('Helvetica')
      .text(`${detail.label}:`, 60, yPosition + 10);
    doc.fontSize(12).fillColor('#1f2937').font('Helvetica-Bold')
      .text(detail.value, 200, yPosition + 10, { width: 300 });
    yPosition += 30;
  });
  // Remove the amount from below the address
  // yPosition += 10;
  // doc.fontSize(28).fillColor('#059669').font('Helvetica-Bold')
  //   .text(`${parseFloat(amount).toLocaleString('en-IN')}`, 60, yPosition);
  // yPosition += 50;

  // Green box: label, amount, and payment method
  const amountBoxHeight = 100;
  const amountBoxGradient = doc.linearGradient(40, yPosition, doc.page.width - 40, yPosition);
  amountBoxGradient.stop(0, '#059669').stop(1, '#10b981');
  doc.rect(40, yPosition, doc.page.width - 80, amountBoxHeight).fill(amountBoxGradient);
  doc.rect(40, yPosition, doc.page.width - 80, amountBoxHeight).stroke('#047857');
  doc.fontSize(14).fillColor('#ffffff').font('Helvetica')
    .text('TOTAL AMOUNT', 60, yPosition + 20, { align: 'left' });
  doc.fontSize(36).fillColor('#ffffff').font('Helvetica-Bold')
    .text(`${parseFloat(amount).toLocaleString('en-IN')}`, 60, yPosition + 45, { align: 'left' });
  doc.fontSize(16).fillColor('#ffffff').font('Helvetica')
    .text(`Payment Method: ${paymentMode}`, doc.page.width - 260, yPosition + 50, { align: 'right', width: 200 });
  yPosition += amountBoxHeight + 20;

  // Digital stamp: centered, below green box, above footer, dark and visible
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

  // **PAYMENT INFORMATION SECTION**
  // Premium amount highlight box
  // Amount box: increase height, move label and value down
  // doc.rect(40, yPosition, doc.page.width - 80, amountBoxHeight).fill(amountBoxGradient);
  // doc.rect(40, yPosition, doc.page.width - 80, amountBoxHeight).stroke('#047857');
  // doc.fontSize(14).fillColor('#ffffff').font('Helvetica')
  //   .text('TOTAL AMOUNT', 60, yPosition + 25, { align: 'left' });
  // doc.fontSize(36).fillColor('#ffffff').font('Helvetica-Bold')
  //   .text(`₹${parseFloat(amount).toLocaleString('en-IN')}`, 60, yPosition + 55, { align: 'left' });
  // doc.fontSize(14).fillColor('#ffffff').font('Helvetica')
  //   .text(`Payment Method: ${paymentMode}`, doc.page.width - 260, yPosition + 55, { align: 'right', width: 200 });

  // Payment mode
  // yPosition += 80; // This line is removed as per the new_code

  // **DESCRIPTION SECTION**
  if (description && description !== '-') {
    doc.rect(40, yPosition, doc.page.width - 80, 35).fill('#f59e0b');
    doc.fontSize(14).fillColor('#ffffff').font('Helvetica-Bold')
       .text('SERVICE DESCRIPTION', 60, yPosition + 12);

    yPosition += 50;
    
    doc.rect(40, yPosition, doc.page.width - 80, 40).fill('#fffbeb').stroke('#fed7aa');
    doc.fontSize(11).fillColor('#92400e').font('Helvetica')
       .text(description, 60, yPosition + 15, { width: doc.page.width - 120 });
    
    yPosition += 60;
  }

  // **PREMIUM FOOTER DESIGN**
  const footerY = doc.page.height - 120;
  
  // Footer gradient
  const footerGradient = doc.linearGradient(0, footerY, doc.page.width, footerY);
  footerGradient.stop(0, '#1f2937').stop(1, '#374151');
  doc.rect(0, footerY, doc.page.width, 120).fill(footerGradient);

  // Gold accent line
  doc.rect(0, footerY, doc.page.width, 3).fill('#fbbf24');

  // Thank you message with luxury styling
  doc.fontSize(18).fillColor('#fbbf24').font('Helvetica-Bold')
     .text('Thank You for Choosing Akrix', 0, footerY + 25, { align: 'center' });

  doc.fontSize(12).fillColor('#d1d5db').font('Helvetica')
     .text('Your trust drives our excellence', 0, footerY + 50, { align: 'center' });

  // Footer with correct contact info
  doc.fontSize(10).fillColor('#9ca3af').font('Helvetica')
    .text('akrix.ai@gmail.com | 9819399470 | https://akrix-ai.netlify.app/', 0, footerY + 75, { align: 'center' });

  // Digital stamp: smaller, centered in lower half
  try {
    const digitalStampPath = path.join(process.cwd(), 'public', 'digital.png');
    const stampWidth = 120;
    const stampHeight = 120;
    const stampX = (doc.page.width - stampWidth) / 2;
    const stampY = doc.page.height * 0.60;
    doc.save();
    doc.opacity(0.18);
    doc.image(digitalStampPath, stampX, stampY, { width: stampWidth, height: stampHeight });
    doc.restore();
  } catch (e) {}

  // Akrix logo watermark (centered, faint)
  try {
    const logoPath = path.join(process.cwd(), 'public', 'akrix-logo.png');
    doc.save();
    doc.opacity(0.07);
    doc.image(logoPath, doc.page.width / 2 - 120, doc.page.height / 2 - 120, { width: 240 });
    doc.restore();
  } catch (e) {}

  // **DECORATIVE ELEMENTS**
  // Corner decorations
  doc.save().strokeColor('#fbbf24').lineWidth(2);
  // Top left corner
  doc.moveTo(40, 170).lineTo(60, 170).stroke();
  doc.moveTo(40, 170).lineTo(40, 190).stroke();
  // Top right corner
  doc.moveTo(doc.page.width - 60, 170).lineTo(doc.page.width - 40, 170).stroke();
  doc.moveTo(doc.page.width - 40, 170).lineTo(doc.page.width - 40, 190).stroke();
  doc.restore();

  doc.moveDown(2); // Add extra space if needed
  doc.end();

}
