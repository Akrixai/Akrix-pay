import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export interface ReceiptData {
  receiptNumber: string;
  date: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  amount: number;
  paymentMode: string;
  paymentId?: string;
  orderId?: string;
  status: string;
}

function wrapText(text: string, maxWidth: number) {
  // Split by word, but only for single lines
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length * 6 <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        lines.push(word);
      }
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export async function generateReceiptPDF(receiptData: ReceiptData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Colors
    const primary = '#2563eb'; // Akrix blue
    const accent = '#10b981'; // Akrix green
    const lightBg = '#f0f9ff';
    const headerBg = '#1e293b';
    const white = '#ffffff';
    const gray = '#64748b';
    const border = '#e0e7ef';
    const pageHeight = doc.page.height;
    const bottomMargin = 60;

    // Header bar with logo and company name
    doc.rect(0, 0, doc.page.width, 70).fill(headerBg);
    try {
      let logoPath = path.join(process.cwd(), 'public', 'akrix-logo.png');
      if (!fs.existsSync(logoPath)) {
        logoPath = path.join(process.cwd(), 'frontend', 'public', 'akrix-logo.png');
      }
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 40, 15, { width: 40, height: 40 });
      }
    } catch {}
    doc
      .fillColor(white)
      .font('Helvetica-Bold')
      .fontSize(24)
      .text('Akrix AI', 90, 25, { align: 'left' });
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#cbd5e1')
      .text('Email: akrix.ai@gmail.com | Phone: 8390690910', 90, 50, { align: 'left' });

    // Receipt title bar
    doc
      .fillColor(primary)
      .rect(0, 80, doc.page.width, 35)
      .fill(primary);
    doc
      .fillColor(white)
      .font('Helvetica-Bold')
      .fontSize(18)
      .text('PAYMENT RECEIPT', 0, 90, { align: 'center' });

    // Receipt number and date
    doc
      .font('Helvetica')
      .fontSize(12)
      .fillColor(gray)
      .text(`Receipt #: ${receiptData.receiptNumber}`, 50, 130)
      .text(`Date: ${receiptData.date}`, 400, 130);

    // --- Dynamic Details Section ---
    let y = 160;
    // Draw background for details
    doc.roundedRect(40, y, doc.page.width - 80, 0, 12).fillAndStroke(lightBg, border); // We'll fix height after
    let detailsStartY = y;
    y += 15;
    // Customer Details (left column)
    doc.font('Helvetica-Bold').fontSize(13).fillColor(primary).text('Customer Details', 60, y);
    y += 22;
    doc.font('Helvetica').fontSize(11).fillColor('#22223b');
    doc.text('Name:', 60, y); doc.font('Helvetica-Bold').text(receiptData.customerName, 130, y); y += 18;
    doc.font('Helvetica').text('Email:', 60, y); doc.font('Helvetica-Bold').text(receiptData.customerEmail, 130, y); y += 18;
    doc.font('Helvetica').text('Phone:', 60, y); doc.font('Helvetica-Bold').text(receiptData.customerPhone, 130, y); y += 18;
    doc.font('Helvetica').text('Address:', 60, y);
    // Split address by newlines, then wrap each line if too long
    const addressLinesRaw = receiptData.customerAddress.split(/\r?\n/);
    let addressLines: string[] = [];
    addressLinesRaw.forEach(line => {
      if (line.trim() === '') return;
      const wrapped = wrapText(line, 38); // 38 chars per line for left column
      addressLines = addressLines.concat(wrapped);
    });
    addressLines.forEach((line, i) => {
      doc.font('Helvetica-Bold').text(line, 130, y + i * 18);
    });
    let leftBlockEndY = y + addressLines.length * 18;
    leftBlockEndY += 10;

    // Payment Details (right column)
    let paymentY = detailsStartY + 15 + 22; // align with 'Payment Details' title
    paymentY = Math.max(paymentY, leftBlockEndY - 60); // ensure not overlapping
    doc.font('Helvetica-Bold').fontSize(13).fillColor(accent).text('Payment Details', 350, paymentY);
    paymentY += 22;
    doc.font('Helvetica').fontSize(11).fillColor('#22223b');
    doc.text('Amount:', 350, paymentY); doc.font('Helvetica-Bold').text(`Rs. ${receiptData.amount.toLocaleString('en-IN')}`, 430, paymentY); paymentY += 18;
    doc.font('Helvetica').text('Payment Mode:', 350, paymentY); doc.font('Helvetica-Bold').text(receiptData.paymentMode.toUpperCase(), 430, paymentY); paymentY += 18;
    doc.font('Helvetica').text('Status:', 350, paymentY); doc.font('Helvetica-Bold').text(receiptData.status.toUpperCase(), 430, paymentY); paymentY += 18;
    doc.font('Helvetica').text('Date:', 350, paymentY); doc.font('Helvetica-Bold').text(receiptData.date, 430, paymentY);

    // Calculate the max Y for the details box
    let detailsEndY = Math.max(leftBlockEndY, paymentY + 18);
    // Redraw the details box with correct height
    doc
      .roundedRect(40, detailsStartY, doc.page.width - 80, detailsEndY - detailsStartY + 15, 12)
      .fillAndStroke(lightBg, border);
    // Redraw content on top (since box redraws over text)
    // Customer Details
    y = detailsStartY + 15;
    doc.font('Helvetica-Bold').fontSize(13).fillColor(primary).text('Customer Details', 60, y);
    y += 22;
    doc.font('Helvetica').fontSize(11).fillColor('#22223b');
    doc.text('Name:', 60, y); doc.font('Helvetica-Bold').text(receiptData.customerName, 130, y); y += 18;
    doc.font('Helvetica').text('Email:', 60, y); doc.font('Helvetica-Bold').text(receiptData.customerEmail, 130, y); y += 18;
    doc.font('Helvetica').text('Phone:', 60, y); doc.font('Helvetica-Bold').text(receiptData.customerPhone, 130, y); y += 18;
    doc.font('Helvetica').text('Address:', 60, y);
    addressLines.forEach((line, i) => {
      doc.font('Helvetica-Bold').text(line, 130, y + i * 18);
    });
    // Payment Details
    paymentY = detailsStartY + 15 + 22;
    paymentY = Math.max(paymentY, leftBlockEndY - 60);
    doc.font('Helvetica-Bold').fontSize(13).fillColor(accent).text('Payment Details', 350, paymentY);
    paymentY += 22;
    doc.font('Helvetica').fontSize(11).fillColor('#22223b');
    doc.text('Amount:', 350, paymentY); doc.font('Helvetica-Bold').text(`Rs. ${receiptData.amount.toLocaleString('en-IN')}`, 430, paymentY); paymentY += 18;
    doc.font('Helvetica').text('Payment Mode:', 350, paymentY); doc.font('Helvetica-Bold').text(receiptData.paymentMode.toUpperCase(), 430, paymentY); paymentY += 18;
    doc.font('Helvetica').text('Status:', 350, paymentY); doc.font('Helvetica-Bold').text(receiptData.status.toUpperCase(), 430, paymentY); paymentY += 18;
    doc.font('Helvetica').text('Date:', 350, paymentY); doc.font('Helvetica-Bold').text(receiptData.date, 430, paymentY);

    // Next section Y
    let nextY = detailsEndY + 30;
    // Prevent drawing past the page height (leave space for footer)
    if (nextY + 120 > pageHeight - bottomMargin) {
      doc.addPage();
      nextY = 60;
    }

    // Total Amount Paid box
    doc
      .roundedRect(40, nextY, doc.page.width - 80, 50, 8)
      .fill(accent)
      .stroke(accent);
    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .fillColor(white)
      .text('TOTAL AMOUNT PAID', 60, nextY + 15)
      .fontSize(22)
      .text(`Rs. ${receiptData.amount.toLocaleString('en-IN')}`, 350, nextY + 10);

    nextY += 70;
    // Thank you message
    doc
      .font('Helvetica-Bold')
      .fontSize(15)
      .fillColor(accent)
      .text('Thank You for Your Payment!', 60, nextY);
    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor('#22223b')
      .text('Your transaction has been processed successfully.', 60, nextY + 20);

    // Footer bar
    doc
      .rect(0, doc.page.height - 60, doc.page.width, 60)
      .fill(primary);
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(white)
      .text('This is a computer-generated receipt and does not require a signature.', 50, doc.page.height - 50)
      .text('For queries, contact: akrix.ai@gmail.com | Visit: https://akrix-ai.vercel.app/', 50, doc.page.height - 35)
      .text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 50, doc.page.height - 20);

    // Watermark
    doc
      .font('Helvetica-Bold')
      .fontSize(60)
      .fillColor('#f3f4f6')
      .rotate(-30, { origin: [doc.page.width / 2, doc.page.height / 2] })
      .text('PAID', doc.page.width / 2 - 80, doc.page.height / 2)
      .rotate(30, { origin: [doc.page.width / 2, doc.page.height / 2] });

    doc.end();
  });
}
