import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { generateReceiptPDF, ReceiptData } from '@/utils/pdfGenerator';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const receiptSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(1),
  customerAddress: z.string().min(1),
  amount: z.number().min(0.01),
  paymentMode: z.string().min(1),
});

function generateReceiptNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `AKRX-${year}${month}${day}-${random}`;
}

export const config = {
  api: {
    bodyParser: true,
    responseLimit: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  try {
    const parsed = receiptSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Invalid input', errors: parsed.error.errors });
    }
    const { customerName, customerEmail, customerPhone, customerAddress, amount, paymentMode } = parsed.data;
    // Find or create user
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', customerEmail)
      .single();
    if (userError && userError.code !== 'PGRST116') {
      return res.status(500).json({ success: false, message: 'Database error', error: userError.message });
    }
    if (!user) {
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert([{ name: customerName, email: customerEmail, phone: customerPhone, address: customerAddress }])
        .select()
        .single();
      if (createUserError) {
        return res.status(500).json({ success: false, message: 'User creation failed', error: createUserError.message });
      }
      user = newUser;
    }
    // Create payment record
    const receiptNumber = generateReceiptNumber();
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([{
        userId: user.id,
        amount,
        paymentMode,
        status: 'completed',
        receiptNumber,
      }])
      .select()
      .single();
    if (paymentError) {
      return res.status(500).json({ success: false, message: 'Payment creation failed', error: paymentError.message });
    }
    // Create receipt record
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .insert([{ paymentId: payment.id, receiptNumber }])
      .select()
      .single();
    if (receiptError) {
      return res.status(500).json({ success: false, message: 'Receipt creation failed', error: receiptError.message });
    }
    // Prepare data for PDF
    const pdfData: ReceiptData = {
      receiptNumber,
      date: new Date().toLocaleDateString('en-IN'),
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      amount,
      paymentMode,
      status: 'completed',
    };
    const pdfBuffer = await generateReceiptPDF(pdfData);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="receipt-${receiptNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
} 