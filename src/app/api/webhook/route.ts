import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PaymentStatus } from '@/types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    // Parse the webhook payload
    const payload = await request.json();
    console.log('Cashfree webhook received:', JSON.stringify(payload));

    // Verify the webhook signature if needed
    // This is a security best practice to ensure the webhook is from Cashfree
    // const signature = request.headers.get('x-webhook-signature');
    // Implement signature verification logic here

    // Extract order details
    const { order } = payload;
    if (!order || !order.order_id) {
      return NextResponse.json(
        { success: false, message: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    const orderId = order.order_id;
    const orderStatus = order.order_status;

    // Find the payment record by Cashfree order ID
    const { data: payment, error: findError } = await supabase
      .from('payments')
      .select('*')
      .eq('cashfreeOrderId', orderId)
      .single();

    if (findError || !payment) {
      console.error('Payment not found for order ID:', orderId);
      return NextResponse.json(
        { success: false, message: 'Payment not found' },
        { status: 404 }
      );
    }

    // Update payment status based on Cashfree order status
    let paymentStatus;
    switch (orderStatus.toLowerCase()) {
      case 'paid':
        paymentStatus = PaymentStatus.SUCCESS;
        break;
      case 'failed':
        paymentStatus = PaymentStatus.FAILED;
        break;
      case 'cancelled':
        paymentStatus = PaymentStatus.CANCELLED;
        break;
      default:
        paymentStatus = PaymentStatus.PENDING;
    }

    // Update the payment record
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: paymentStatus,
        cashfreePaymentStatus: orderStatus,
        cashfreePaymentTime: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', payment.id);

    if (updateError) {
      console.error('Error updating payment:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to update payment' },
        { status: 500 }
      );
    }

    // If payment is successful, generate receipt
    if (paymentStatus === PaymentStatus.SUCCESS) {
      // You can add receipt generation logic here or call another API
      // For example:
      // await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/receipt/generate`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ paymentId: payment.id }),
      // });
    }

    return NextResponse.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}