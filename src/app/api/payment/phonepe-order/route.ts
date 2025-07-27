import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import axios from 'axios';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
);

const paymentSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  address: z.string().min(1),
  amount: z.number().min(0.01),
  paymentMode: z.string().min(1),
});

function generateReceiptNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `AKRX-${year}${month}${day}-${random}`;
}

// UAT Test Credentials
const clientId = process.env.PHONEPE_CLIENT_ID!;
const saltKey = process.env.PHONEPE_SALT_KEY!;
const saltIndex = process.env.PHONEPE_SALT_INDEX || "1";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = paymentSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid input', errors: parsed.error.errors },
        { status: 400 }
      );
    }
    
    const { name, email, phone, address, amount, paymentMode } = parsed.data;

    // Find or create user
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      return NextResponse.json(
        { success: false, message: 'Database error', error: userError.message },
        { status: 500 }
      );
    }

    if (!user) {
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert([{ name, email, phone, mobile: phone, address }])
        .select()
        .single();

      if (createUserError) {
        return NextResponse.json(
          { success: false, message: 'User creation failed', error: createUserError.message },
          { status: 500 }
        );
      }
      user = newUser;
    }

    // Create payment record
    const receiptNumber = generateReceiptNumber();
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([{
        userId: user.id,
        amount,
        paymentMode: 'phonepe',
        status: 'pending',
        receiptNumber,
      }])
      .select()
      .single();

    if (paymentError) {
      console.error('Supabase payment creation error:', paymentError);
      return NextResponse.json(
        { success: false, message: 'Payment creation failed', error: paymentError.message },
        { status: 500 }
      );
    }

    const payload = {
      merchantId: clientId,
      merchantTransactionId: receiptNumber,
      merchantUserId: user.id,
      amount: amount * 100, // Amount in paise
      redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/customer/payments`,
      redirectMode: 'POST',
      callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/phonepe-callback`,
      mobileNumber: phone,
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const checksum = crypto.createHash('sha256').update(base64Payload + '/pg/v1/pay' + saltKey).digest('hex') + '###' + saltIndex;

    try {
      const response = await axios.post('https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay', {
        request: base64Payload
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
          'accept': 'application/json'
        }
      });

      return NextResponse.json({
        success: true,
        data: response.data
      });

    } catch (error: any) {
      console.error("PhonePe API error:", error.response ? error.response.data : error.message);
      return NextResponse.json(
        { success: false, message: 'PhonePe API error', error: error.response ? error.response.data : error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}