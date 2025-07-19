import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const smtpUser = process.env.SMTP_USER!;
const smtpPass = process.env.SMTP_PASS!;
const akrixEmail = process.env.AKRIX_EMAIL || 'akrix.ai@gmail.com';

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465, // true for 465, false for other ports
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

export async function sendReceiptToClient(clientEmail: string, clientName: string, amount: number, receiptBuffer: Buffer, receiptNumber: string) {
  const mailOptions = {
    from: smtpUser,
    to: clientEmail,
    subject: '🎉 Payment Successful - Receipt from Akrix',
    html: `<p>Dear ${clientName},<br>Your payment of ₹${amount.toLocaleString('en-IN')} was successful.<br>Receipt #: <b>${receiptNumber}</b></p>`,
    attachments: [
      {
        filename: `Receipt_${receiptNumber}.pdf`,
        content: receiptBuffer,
        contentType: 'application/pdf',
      },
    ],
  };
  await transporter.sendMail(mailOptions);
}

export async function sendPaymentNotificationToAkrix(clientName: string, clientEmail: string, amount: number, receiptBuffer: Buffer, receiptNumber: string) {
  const mailOptions = {
    from: smtpUser,
    to: akrixEmail,
    subject: `💰 New Payment Received - ₹${amount.toLocaleString('en-IN')} from ${clientName}`,
    html: `<p>New payment received from ${clientName} (${clientEmail})<br>Amount: ₹${amount.toLocaleString('en-IN')}<br>Receipt #: <b>${receiptNumber}</b></p>`,
    attachments: [
      {
        filename: `Receipt_${receiptNumber}.pdf`,
        content: receiptBuffer,
        contentType: 'application/pdf',
      },
    ],
  };
  await transporter.sendMail(mailOptions);
}

export async function sendPaymentReminderEmail(clientEmail: string, clientName: string, amount: number, message: string) {
  const mailOptions = {
    from: smtpUser,
    to: clientEmail,
    subject: '⏰ Payment Reminder - Akrix',
    html: `
      <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 32px; border-radius: 16px; max-width: 500px; margin: auto;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src='https://akrixai-pay.netlify.app/akrix-logo.png' alt='Akrix Logo' style='height: 48px; margin-bottom: 8px;' />
          <h2 style="color: #4f46e5; margin: 0;">Akrix Payment Reminder</h2>
        </div>
        <p style="font-size: 16px; color: #222;">Dear <b>${clientName}</b>,</p>
        <p style="font-size: 16px; color: #222;">This is a friendly reminder that a payment of <b>₹${amount.toLocaleString('en-IN')}</b> is due.</p>
        <div style="background: #e0e7ff; padding: 16px; border-radius: 8px; margin: 16px 0; color: #3730a3;">
          ${message}
        </div>
        <p style="font-size: 15px; color: #444;">If you have already made the payment, please ignore this message.</p>
        <p style="font-size: 15px; color: #444;">Thank you for choosing <b>Akrix</b>.<br>- Akrix Team</p>
        <div style="text-align: center; margin-top: 24px;">
          <a href="https://akrix.ai" style="background: #4f46e5; color: #fff; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Pay Now</a>
        </div>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
} 