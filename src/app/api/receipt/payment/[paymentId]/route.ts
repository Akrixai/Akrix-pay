import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest, { params }: { params: { paymentId: string } }) {
  try {
    const paymentId = params.paymentId;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Missing payment ID' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Fetch the payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (paymentError) {
      console.error('Error fetching payment:', paymentError);
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Fetch the associated receipt if it exists
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .select('*')
      .eq('payment_id', paymentId)
      .single();

    // We don't return an error if receipt is not found, as it might not exist yet
    if (receiptError && receiptError.code !== 'PGRST116') {
      console.error('Error fetching receipt:', receiptError);
    }

    return NextResponse.json({
      payment,
      receipt: receipt || null,
    });
  } catch (error) {
    console.error('Unexpected error in payment details API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}