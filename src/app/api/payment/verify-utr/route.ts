import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = utrSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid input', errors: parsed.error.errors },
        { status: 400 }
      );
    }
    
    const { paymentId, utr } = parsed.data;
    
    if (!validateUTR(utr)) {
      return NextResponse.json(
        { success: false, message: 'Invalid UTR format' },
        { status: 400 }
      );
    }
    
    // Update payment status to completed
    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update({ status: 'completed', utr })
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
      message: 'UTR payment verified successfully',
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