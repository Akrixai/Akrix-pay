import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PaymentStatus } from '@/types';
import crypto from 'crypto';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    // Parse the webhook payload
    const payload = await request.json();
    console.log('Cashfree webhook payload:', payload);

    // Verify the webhook signature
    const isValid = verifyCashfreeWebhook(request, payload);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    // Extract payment details from the payload
    const {
      data: {
        order: {
          order_id,
          order_amount,
          order_currency,
          order_status,
        },
        payment: {
          cf_payment_id,
          payment_status,
          payment_method,
          payment_time,
        },
      },
    } = payload;

    // Map Cashfree payment status to our application's payment status
    let appPaymentStatus;
    switch (payment_status.toLowerCase()) {
      case 'success':
        appPaymentStatus = PaymentStatus.SUCCESS;
        break;
      case 'failed':
        appPaymentStatus = PaymentStatus.FAILED;
        break;
      case 'cancelled':
        appPaymentStatus = PaymentStatus.CANCELLED;
        break;
      default:
        appPaymentStatus = PaymentStatus.PENDING;
    }

    // Update payment record in the database
    const { data, error } = await supabase
      .from('payments')
      .update({
        status: appPaymentStatus,
        cashfreepaymentid: cf_payment_id,
        cashfreepaymentmethod: payment_method,
        cashfreepaymentstatus: payment_status,
        cashfreepaymenttime: payment_time ? new Date(payment_time).toISOString() : null,
        updatedAt: new Date().toISOString(),
      })
      .eq('cashfreeorderid', order_id)
      .select();

    if (error) {
      console.error('Error updating payment record:', error);
      return NextResponse.json({ error: 'Failed to update payment record' }, { status: 500 });
    }

    // If payment is successful, generate receipt
    if (appPaymentStatus === PaymentStatus.SUCCESS) {
      try {
        // Call receipt generation API
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/send-direct-receipt-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentId: data[0].id,
          }),
        });
      } catch (receiptError) {
        console.error('Receipt generation error:', receiptError);
        // Continue processing even if receipt generation fails
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Payment webhook processed successfully',
      data,
    });
  } catch (error) {
    console.error('Error processing Cashfree webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// Function to verify Cashfree webhook signature
function verifyCashfreeWebhook(request: NextRequest, payload: any): boolean {
  try {
    // Get the signature from the request headers
    const signature = request.headers.get('x-webhook-signature');
    if (!signature) return false;
    
    const secretKey = process.env.CASHFREE_SECRET_KEY!;
    const data = JSON.stringify(payload);
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(data)
      .digest('hex');
    
    // Compare signatures
    return signature === expectedSignature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}