import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const verifySchema = z.object({
  razorpayPaymentId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpaySignature: z.string().min(1),
  paymentId: z.string().min(1),
});

function verifySignature(orderId: string, paymentId: string, signature: string, keySecret: string) {
  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(orderId + '|' + paymentId)
    .digest('hex');
  return generatedSignature === signature;
}

async function generateReceiptForPayment(paymentId: string) {
  // Check if receipt exists
  const { data: existingReceipt } = await supabase
    .from('receipts')
    .select('*')
    .eq('paymentId', paymentId)
    .single();
  if (existingReceipt) return existingReceipt;

  // Get payment for receipt number
  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single();
  if (!payment) return null;

  const { data: receipt } = await supabase
    .from('receipts')
    .insert([{ paymentId, receiptNumber: payment.receiptNumber }])
    .select()
    .single();
  return receipt;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Invalid input', errors: parsed.error.errors });
    }
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId } = parsed.data;

    // Verify signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET!;
    const isValid = verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature, keySecret);
    if (!isValid) {
      // Mark payment as failed
      await supabase.from('payments').update({ status: 'failed' }).eq('id', paymentId);
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Update payment status to completed
    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature,
      })
      .eq('id', paymentId)
      .select()
      .single();
    if (updateError) {
      return res.status(500).json({ success: false, message: 'Failed to update payment', error: updateError.message });
    }

    // Generate receipt if not exists
    const receipt = await generateReceiptForPayment(paymentId);

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      payment: updatedPayment,
      receipt,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
} 