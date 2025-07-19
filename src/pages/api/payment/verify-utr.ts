import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const utrSchema = z.object({
  paymentId: z.string().min(1),
  utr: z.string().min(1),
});

function validateUTR(utr: string) {
  // Simple validation: UTR should be alphanumeric and 10-22 chars
  return /^[A-Za-z0-9]{10,22}$/.test(utr);
}

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
    const parsed = utrSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Invalid input', errors: parsed.error.errors });
    }
    const { paymentId, utr } = parsed.data;
    if (!validateUTR(utr)) {
      return res.status(400).json({ success: false, message: 'Invalid UTR format' });
    }
    // Update payment status to completed
    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update({ status: 'completed', utr })
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
      message: 'UTR payment verified successfully',
      payment: updatedPayment,
      receipt,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
} 