import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const qrSchema = z.object({
  paymentId: z.string().min(1),
  utr: z.string().optional(),
  details: z.any().optional(),
});

async function generateReceiptForPayment(paymentId: string) {
  const { data: existingReceipt } = await supabase
    .from('receipts')
    .select('*')
    .eq('paymentId', paymentId)
    .single();
  if (existingReceipt) return existingReceipt;
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
    const parsed = qrSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Invalid input', errors: parsed.error.errors });
    }
    const { paymentId, utr, details } = parsed.data;
    // Update payment status to completed
    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update({ status: 'completed', utr, details })
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
      message: 'QR payment processed successfully',
      payment: updatedPayment,
      receipt,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
} 