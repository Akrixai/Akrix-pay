import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = qrSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid input', errors: parsed.error.errors },
        { status: 400 }
      );
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
      return NextResponse.json(
        { success: false, message: 'Failed to update payment', error: updateError.message },
        { status: 500 }
      );
    }
    
    // Generate receipt if not exists
    const receipt = await generateReceiptForPayment(paymentId);
    
    // Optionally trigger receipt email
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/send-direct-receipt-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId,
        }),
      });
    } catch (receiptError) {
      console.error('Failed to send receipt email:', receiptError);
      // Continue execution even if receipt email fails
    }
    
    return NextResponse.json({
      success: true,
      message: 'QR payment processed successfully',
      payment: updatedPayment,
      receipt,
    });
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}