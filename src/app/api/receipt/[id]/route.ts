import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const receiptId = params.id;

    if (!receiptId) {
      return NextResponse.json(
        { error: 'Missing receipt ID' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Fetch the receipt
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .select('*')
      .eq('id', receiptId)
      .single();

    if (receiptError) {
      console.error('Error fetching receipt:', receiptError);
      return NextResponse.json(
        { error: 'Receipt not found' },
        { status: 404 }
      );
    }

    // Fetch the associated payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', receipt.payment_id)
      .single();

    if (paymentError) {
      console.error('Error fetching payment:', paymentError);
      // We still return the receipt even if payment is not found
    }

    return NextResponse.json({
      receipt,
      payment: payment || null,
    });
  } catch (error) {
    console.error('Unexpected error in receipt details API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}