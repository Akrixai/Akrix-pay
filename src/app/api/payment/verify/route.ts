import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { PaymentStatus } from '@/types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { orderId, gateway } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Missing order ID' },
        { status: 400 }
      );
    }

    // Handle different payment gateways
    if (gateway === 'cashfree') {
      return await verifyCashfreePayment(orderId);
    } else if (gateway === 'razorpay') {
      // Implement Razorpay verification if needed
      return NextResponse.json(
        { success: false, message: 'Razorpay verification not implemented' },
        { status: 501 }
      );
    } else if (gateway === 'phonepe') {
      // Implement PhonePe verification if needed
      return NextResponse.json(
        { success: false, message: 'PhonePe verification not implemented' },
        { status: 501 }
      );
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid payment gateway' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}

async function verifyCashfreePayment(orderId: string) {
  try {
    // Set the Cashfree API base URL based on environment
    const cashfreeEnv = process.env.CASHFREE_ENV || 'production';
    const cashfreeBaseUrl = cashfreeEnv === 'production'
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';

    // Get order details from Cashfree
    const response = await axios.get(
      `${cashfreeBaseUrl}/orders/${orderId}`,
      {
        headers: {
          'x-api-version': '2022-09-01',
          'x-client-id': process.env.CASHFREE_APP_ID,
          'x-client-secret': process.env.CASHFREE_SECRET_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const orderData = response.data;
    
    // Map Cashfree order status to our application's payment status
    let appPaymentStatus;
    switch (orderData.order_status.toLowerCase()) {
      case 'paid':
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
        updatedAt: new Date().toISOString(),
      })
      .eq('cashfreeorderid', orderId)
      .select();

    if (error) {
      console.error('Error updating payment record:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update payment record' },
        { status: 500 }
      );
    }

    // Return success or failure based on payment status
    if (appPaymentStatus === PaymentStatus.SUCCESS) {
      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          paymentId: data[0].id,
          receiptNumber: data[0].receiptnumber,
          amount: data[0].amount,
          status: appPaymentStatus,
        },
      });
    } else {
      return NextResponse.json({
        success: false,
        message: `Payment ${appPaymentStatus.toLowerCase()}`,
        data: {
          paymentId: data[0].id,
          status: appPaymentStatus,
        },
      });
    }
  } catch (error: any) {
    console.error('Cashfree verification error:', error.message);
    console.error('Cashfree verification error details:', error.response?.data);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to verify Cashfree payment',
        details: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}