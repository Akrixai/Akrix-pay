import { NextRequest, NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import path from 'path';
import { sendDirectReceiptEmail } from '@/services/emailService';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Set max duration to 60 seconds

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
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
    } = body;

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
    doc.on('data', (chunk) => {
      buffers.push(Buffer.from(chunk));
    });
    
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
        user: process.env.SMTP_USER ? '✓' : '✗',
        pass: process.env.SMTP_PASS ? '✓' : '✗',
      });

      // **LUXURIOUS HEADER DESIGN**
      // Premium gradient background
      const headerGradient = doc.linearGradient(0, 0, doc.page.width, 0);
      headerGradient.stop(0, '#1e3a8a').stop(0.3, '#3730a3').stop(0.7, '#7c3aed').stop(1, '#a855f7');
      doc.save().rect(0, 0, doc.page.width, 140).fill(headerGradient).restore();

      // Elegant border accent
      doc.rect(0, 140, doc.page.width, 3).fill('#f0abfc');

      // Company logo and name
      doc.save();
      doc.translate(40, 40);
      doc.font('Helvetica-Bold').fontSize(28).fillColor('#ffffff');
      doc.text('AKRIX', 0, 0);
      doc.font('Helvetica').fontSize(12).fillColor('#e0e7ff');
      doc.text('Premium Receipt', 0, 35);
      doc.restore();

      // Receipt number and date
      doc.save();
      doc.translate(doc.page.width - 200, 40);
      doc.font('Helvetica-Bold').fontSize(16).fillColor('#ffffff');
      doc.text('RECEIPT', 0, 0, { align: 'right' });
      doc.font('Helvetica').fontSize(10).fillColor('#e0e7ff');
      doc.text(`#${finalReceiptNumber}`, 0, 25, { align: 'right' });
      doc.text(`Date: ${currentDate}`, 0, 40, { align: 'right' });
      doc.restore();

      // **CUSTOMER INFORMATION SECTION**
      doc.roundedRect(40, 180, doc.page.width - 80, 120, 10).fill('#f8fafc').stroke('#e2e8f0');
      
      // Project name if provided
      let yPos = 200;
      if (projectName) {
        doc.font('Helvetica-Bold').fontSize(16).fillColor('#1e293b');
        doc.text(`Project: ${projectName}`, 60, yPos);
        yPos += 30;
      }

      // Customer details
      doc.font('Helvetica-Bold').fontSize(14).fillColor('#334155');
      doc.text('Customer Details', 60, yPos);
      yPos += 25;

      doc.font('Helvetica').fontSize(11).fillColor('#475569');
      doc.text(`Name: ${customerName}`, 60, yPos);
      yPos += 20;
      doc.text(`Email: ${customerEmail}`, 60, yPos);
      yPos += 20;
      if (customerPhone) {
        doc.text(`Phone: ${customerPhone}`, 60, yPos);
        yPos += 20;
      }
      if (address) {
        doc.text(`Address: ${address}`, 60, yPos);
      }

      // **PAYMENT DETAILS SECTION**
      doc.roundedRect(40, 320, doc.page.width - 80, 120, 10).fill('#f0f9ff').stroke('#bae6fd');

      doc.font('Helvetica-Bold').fontSize(14).fillColor('#0369a1');
      doc.text('Payment Details', 60, 340);

      doc.font('Helvetica').fontSize(11).fillColor('#0c4a6e');
      doc.text(`Amount: ₹${amount.toLocaleString('en-IN')}`, 60, 370);
      doc.text(`Payment Method: ${paymentMode}`, 60, 390);
      doc.text(`Service Type: ${serviceType}`, 60, 410);

      // **DESCRIPTION SECTION**
      if (description) {
        doc.roundedRect(40, 460, doc.page.width - 80, 100, 10).fill('#f0fdf4').stroke('#bbf7d0');

        doc.font('Helvetica-Bold').fontSize(14).fillColor('#166534');
        doc.text('Service Description', 60, 480);

        doc.font('Helvetica').fontSize(11).fillColor('#14532d');
        doc.text(description, 60, 505, { width: doc.page.width - 120, align: 'left' });
      }

      // **FOOTER SECTION**
      const footerY = description ? 580 : 460;
      
      // Thank you message
      doc.font('Helvetica-Bold').fontSize(14).fillColor('#6d28d9');
      doc.text('Thank You for Your Business!', 0, footerY, { align: 'center' });

      // Company contact info
      doc.font('Helvetica').fontSize(10).fillColor('#64748b');
      doc.text('Akrix AI | akrix.ai@gmail.com | +91 8390690910', 0, footerY + 25, { align: 'center' });

      // Finalize the PDF
      doc.end();
      
      // Wait for PDF generation to complete
      const pdfBuffer = await pdfGenerationComplete;
      
      // Send the email with the PDF attachment
      await sendDirectReceiptEmail(
        customerEmail,
        customerName,
        amount,
        pdfBuffer,
        finalReceiptNumber,
        projectName || '',
        customerPhone || '',
        address || '',
        paymentMode,
        serviceType,
        description || ''
      );
      
      return NextResponse.json({
        success: true,
        message: 'Receipt email sent successfully',
        receiptNumber: finalReceiptNumber
      });
    } catch (emailError: any) {
      console.error('Error sending receipt email:', emailError);
      return NextResponse.json(
        { success: false, message: 'Failed to send receipt email', error: emailError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}