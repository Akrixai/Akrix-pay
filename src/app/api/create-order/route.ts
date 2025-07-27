import { NextRequest, NextResponse } from 'next/server';
import { Cashfree } from 'cashfree-pg';

// Initialize Cashfree
Cashfree.XClientId = process.env.CASHFREE_APP_ID!;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY!;
Cashfree.XEnvironment = process.env.CASHFREE_ENV === 'production'
  ? 'PRODUCTION'
  : 'SANDBOX';

export async function POST(request: NextRequest) {
  if (request.method !== 'POST') {
    return NextResponse.json(
      { success: false, message: 'Method not allowed' },
      { status: 405 }
    );
  }

  try {
    const body = await request.json();
    const { amount, customerName, customerEmail, customerPhone } = body;
    const orderId = `order_${Date.now()}`;

    const order = {
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: `customer_${Date.now()}`,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone
      },
      order_meta: {
        return_url: `${process.env.CASHFREE_ENV === 'production' 
          ? (process.env.NEXT_PUBLIC_APP_URL || 'https://akrixpay.vercel.app')
          : 'https://akrixpay.vercel.app'}/payment/success?order_id={order_id}`,
        notify_url: `${process.env.CASHFREE_ENV === 'production' 
          ? (process.env.NEXT_PUBLIC_APP_URL || 'https://akrixpay.vercel.app')
          : 'https://akrixpay.vercel.app'}/api/webhook`
      }
    };

    try {
      const response = await Cashfree.PGCreateOrder("2023-08-01", order);
      return NextResponse.json({
        success: true,
        payment_session_id: response.data.payment_session_id,
        order_id: response.data.order_id
      });
    } catch (error: any) {
      console.error('Error creating order:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to create order',
        error: error.message
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error processing request:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}