import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const paymentSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  address: z.string().min(1),
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const parsed = paymentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Invalid input', errors: parsed.error.errors });
    }
    const { name, email, phone, address, amount, paymentMode } = parsed.data;

    // Find or create user
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    if (userError && userError.code !== 'PGRST116') {
      return res.status(500).json({ success: false, message: 'Database error', error: userError.message });
    }
    if (!user) {
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert([{ name, email, phone, address }])
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
        status: 'pending',
        receiptNumber,
      }])
      .select()
      .single();
    if (paymentError) {
      return res.status(500).json({ success: false, message: 'Payment creation failed', error: paymentError.message });
    }

    // Create Razorpay order
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: receiptNumber,
    });

    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentId: payment.id,
      receiptNumber,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
} 