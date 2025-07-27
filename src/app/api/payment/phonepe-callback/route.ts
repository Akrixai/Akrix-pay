import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
);

const clientSecret = process.env.PHONEPE_CLIENT_SECRET!;
const clientVersion = parseInt(process.env.PHONEPE_CLIENT_VERSION || "1");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { response: base64Response } = body;
    const decodedResponse = JSON.parse(Buffer.from(base64Response, 'base64').toString('utf-8'));
    
    const { code, merchantId, merchantTransactionId, transactionId } = decodedResponse;

    const xVerify = request.headers.get('x-verify');
    const checksum = crypto.createHash('sha256').update(base64Response + clientSecret).digest('hex') + '###' + clientVersion;

    if (xVerify !== checksum) {
      return NextResponse.json(
        { success: false, message: 'Invalid checksum' },
        { status: 400 }
      );
    }

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('receiptNumber', merchantTransactionId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json(
        { success: false, message: 'Payment not found' },
        { status: 404 }
      );
    }
    
    if (code === 'PAYMENT_SUCCESS') {
      await supabase
        .from('payments')
        .update({ status: 'completed', phonepeTransactionId: transactionId })
        .eq('id', payment.id);
        
      // Optionally trigger receipt generation
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/send-direct-receipt-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentId: payment.id,
          }),
        });
      } catch (receiptError) {
        console.error('Failed to generate receipt:', receiptError);
        // Continue execution even if receipt generation fails
      }
    } else {
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('id', payment.id);
    }
    
    // For API callbacks, return a JSON response
    return NextResponse.json({ success: true });
    
    // For redirect callbacks, use the following instead:
    // return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/customer/payments?status=${code}`);
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}