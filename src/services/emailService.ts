// @ts-ignore: No type definitions for nodemailer
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
  const logoUrl = 'https://akrixai-pay.netlify.app/akrix-logo.png';
  const mailOptions = {
    from: smtpUser,
    to: clientEmail,
    subject: '⏰ Payment Reminder - Akrix',
    html: `
      <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 32px; border-radius: 16px; max-width: 500px; margin: auto;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src='${logoUrl}' alt='Akrix Logo' style='height: 48px; margin-bottom: 8px;' />
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
          <a href="https://akrixai-pay.netlify.app/qr-pay" style="background: #4f46e5; color: #fff; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Pay Now</a>
        </div>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
}

export async function sendDirectReceiptEmail(
  clientEmail: string, 
  clientName: string, 
  amount: number, 
  receiptBuffer: Buffer, 
  receiptNumber: string,
  projectName: string,
  clientPhone: string,
  clientAddress: string,
  paymentMode: string,
  serviceType: string,
  description: string
) {
  const logoUrl = 'https://akrixai-pay.netlify.app/akrix-logo.png';
  const mailOptions = {
    from: smtpUser,
    to: clientEmail,
    subject: '🧾 Your Receipt from Akrix',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background: linear-gradient(135deg, #f0f4f8, #e6f0f9); padding: 40px; max-width: 650px; margin: auto; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
        <!-- PREMIUM HEADER -->
        <div style="text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #1e3a8a, #3730a3, #7c3aed, #a855f7); padding: 30px; border-radius: 16px; box-shadow: 0 8px 20px rgba(123, 58, 237, 0.3);">
          <img src='${logoUrl}' alt='Akrix Logo' style='height: 70px; margin-bottom: 15px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2));' />
          <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: 1px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">PAYMENT RECEIPT</h1>
          <div style="height: 5px; background: linear-gradient(to right, #f59e0b, #fbbf24, #f59e0b); width: 100%; margin-top: 20px; border-radius: 5px;"></div>
        </div>
        
        <!-- RECEIPT DETAILS -->
        <div style="background: #ffffff; border-radius: 16px; padding: 30px; box-shadow: 0 8px 15px rgba(0,0,0,0.05); margin-bottom: 25px; border-left: 5px solid #4f46e5;">
          <h2 style="color: #4f46e5; margin-top: 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; font-size: 22px; display: flex; align-items: center;">
            <span style="background: #4f46e5; color: white; width: 30px; height: 30px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px; font-size: 16px;">📄</span>
            Receipt Details
          </h2>
          <div style="display: flex; flex-wrap: wrap; gap: 15px;">
            <div style="flex: 1; min-width: 200px; background: #f8fafc; padding: 15px; border-radius: 10px;">
              <p style="margin: 0; font-size: 14px; color: #64748b;">Receipt Number</p>
              <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; color: #1e293b;">${receiptNumber}</p>
            </div>
            <div style="flex: 1; min-width: 200px; background: #f8fafc; padding: 15px; border-radius: 10px;">
              <p style="margin: 0; font-size: 14px; color: #64748b;">Date Issued</p>
              <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; color: #1e293b;">${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>
        </div>
        
        <!-- CUSTOMER INFORMATION -->
        <div style="background: #ffffff; border-radius: 16px; padding: 30px; box-shadow: 0 8px 15px rgba(0,0,0,0.05); margin-bottom: 25px; border-left: 5px solid #6366f1;">
          <h2 style="color: #6366f1; margin-top: 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; font-size: 22px; display: flex; align-items: center;">
            <span style="background: #6366f1; color: white; width: 30px; height: 30px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px; font-size: 16px;">👤</span>
            Customer Information
          </h2>
          <table style="width: 100%; border-collapse: separate; border-spacing: 0 8px;">
            <tr>
              <td style="padding: 12px; background: #f1f5f9; border-radius: 8px 0 0 8px; width: 140px; color: #64748b; font-weight: 500;">Project Name</td>
              <td style="padding: 12px; background: #f8fafc; border-radius: 0 8px 8px 0; font-weight: bold; color: #1e293b;">${projectName}</td>
            </tr>
            <tr>
              <td style="padding: 12px; background: #f1f5f9; border-radius: 8px 0 0 8px; width: 140px; color: #64748b; font-weight: 500;">Full Name</td>
              <td style="padding: 12px; background: #f8fafc; border-radius: 0 8px 8px 0; font-weight: bold; color: #1e293b;">${clientName}</td>
            </tr>
            <tr>
              <td style="padding: 12px; background: #f1f5f9; border-radius: 8px 0 0 8px; width: 140px; color: #64748b; font-weight: 500;">Email</td>
              <td style="padding: 12px; background: #f8fafc; border-radius: 0 8px 8px 0; font-weight: bold; color: #1e293b;">${clientEmail}</td>
            </tr>
            <tr>
              <td style="padding: 12px; background: #f1f5f9; border-radius: 8px 0 0 8px; width: 140px; color: #64748b; font-weight: 500;">Phone</td>
              <td style="padding: 12px; background: #f8fafc; border-radius: 0 8px 8px 0; font-weight: bold; color: #1e293b;">${clientPhone}</td>
            </tr>
            <tr>
              <td style="padding: 12px; background: #f1f5f9; border-radius: 8px 0 0 8px; width: 140px; color: #64748b; font-weight: 500;">Address</td>
              <td style="padding: 12px; background: #f8fafc; border-radius: 0 8px 8px 0; font-weight: bold; color: #1e293b;">${clientAddress}</td>
            </tr>
          </table>
        </div>
        
        <!-- PAYMENT DETAILS -->
        <div style="background: linear-gradient(135deg, #047857, #10b981); border-radius: 16px; padding: 30px; box-shadow: 0 10px 20px rgba(16, 185, 129, 0.3); margin-bottom: 25px; color: white;">
          <h2 style="margin-top: 0; border-bottom: 2px solid rgba(255,255,255,0.2); padding-bottom: 12px; font-size: 22px; display: flex; align-items: center;">
            <span style="background: rgba(255,255,255,0.2); width: 30px; height: 30px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px; font-size: 16px;">💰</span>
            Payment Details
          </h2>
          <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 20px; margin-top: 15px;">
            <div style="flex: 2; min-width: 200px;">
              <p style="margin: 0; font-size: 16px; opacity: 0.9;">Total Amount</p>
              <p style="margin: 5px 0 0 0; font-size: 36px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">₹${amount.toLocaleString('en-IN')}</p>
            </div>
            <div style="flex: 1; min-width: 200px; background: rgba(255,255,255,0.1); padding: 15px; border-radius: 12px;">
              <p style="margin: 0; font-size: 14px; opacity: 0.9;">Payment Method</p>
              <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; display: flex; align-items: center;">
                <span style="background: rgba(255,255,255,0.2); width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 8px; font-size: 12px;">✓</span>
                ${paymentMode}
              </p>
            </div>
          </div>
          <div style="margin-top: 15px; background: rgba(255,255,255,0.1); padding: 15px; border-radius: 12px;">
            <p style="margin: 0; font-size: 14px; opacity: 0.9;">Service Type</p>
            <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; display: flex; align-items: center;">
              <span style="background: rgba(255,255,255,0.2); width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 8px; font-size: 12px;">🔧</span>
              ${serviceType}
            </p>
          </div>
        </div>
        
        <!-- SERVICE DESCRIPTION -->
        ${description ? `
        <div style="background: linear-gradient(to right, #fffbeb, #fff7ed); border-radius: 16px; padding: 30px; box-shadow: 0 8px 15px rgba(245, 158, 11, 0.1); margin-bottom: 25px; border: 1px solid #fed7aa;">
          <h2 style="color: #d97706; margin-top: 0; border-bottom: 2px solid #fed7aa; padding-bottom: 12px; font-size: 22px; display: flex; align-items: center;">
            <span style="background: #f59e0b; color: white; width: 30px; height: 30px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px; font-size: 16px;">📝</span>
            Service Description
          </h2>
          <div style="background: white; padding: 20px; border-radius: 12px; margin-top: 15px; border-left: 3px solid #f59e0b;">
            <p style="margin: 0; font-size: 16px; color: #92400e; line-height: 1.6;">${description}</p>
          </div>
        </div>
        ` : ''}
        
        <!-- THANK YOU MESSAGE -->
        <div style="text-align: center; background: #ffffff; border-radius: 16px; padding: 30px; box-shadow: 0 8px 15px rgba(0,0,0,0.05); margin-bottom: 25px;">
          <div style="width: 80px; height: 80px; background: #4f46e5; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; box-shadow: 0 8px 15px rgba(79, 70, 229, 0.3);">
            <span style="font-size: 40px; color: white;">✓</span>
          </div>
          <h2 style="color: #4f46e5; margin: 0 0 10px 0; font-size: 24px;">Thank You!</h2>
          <p style="font-size: 16px; color: #64748b; margin: 0;">We appreciate your business and look forward to serving you again.</p>
        </div>
        
        <!-- FOOTER -->
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <div style="margin-bottom: 15px;">
            <a href="https://akrix-ai.netlify.app/" style="display: inline-block; background: #4f46e5; color: white; text-decoration: none; font-weight: bold; padding: 10px 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);">Visit Our Website</a>
          </div>
          <div style="display: flex; justify-content: center; gap: 15px; margin-bottom: 20px;">
            <div style="width: 36px; height: 36px; background: #4f46e5; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 16px;">📧</span>
            </div>
            <div style="width: 36px; height: 36px; background: #4f46e5; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 16px;">📱</span>
            </div>
            <div style="width: 36px; height: 36px; background: #4f46e5; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 16px;">🌐</span>
            </div>
          </div>
          <p style="font-size: 14px; color: #64748b; margin: 0;">
            <a href="mailto:akrix.ai@gmail.com" style="color: #4f46e5; text-decoration: none; font-weight: bold;">akrix.ai@gmail.com</a> | 
            <a href="tel:9819399470" style="color: #4f46e5; text-decoration: none; font-weight: bold;">9819399470</a>
          </p>
          <p style="font-size: 14px; color: #94a3b8; margin: 10px 0 0 0;">
            <a href="https://akrix-ai.netlify.app/" style="color: #4f46e5; text-decoration: none; font-weight: bold;">Powered by Akrix AI</a> - Making technology work for you
          </p>
        </div>
      </div>
    `,
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