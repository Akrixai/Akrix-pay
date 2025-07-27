import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('order_id');
    const paymentId = searchParams.get('payment_id');

    if (!orderId && !paymentId) {
      return NextResponse.json(
        { error: 'Missing order_id or payment_id parameter' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Query based on either order_id or payment_id
    let paymentQuery = supabase.from('payments').select('*');
    
    if (orderId) {
      paymentQuery = paymentQuery.eq('order_id', orderId);
    } else if (paymentId) {
      paymentQuery = paymentQuery.eq('id', paymentId);
    }

    const { data: payment, error: paymentError } = await paymentQuery.single();

    if (paymentError) {
      console.error('Error fetching payment:', paymentError);
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Fetch the receipt associated with this payment
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .select('*')
      .eq('payment_id', payment.id)
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