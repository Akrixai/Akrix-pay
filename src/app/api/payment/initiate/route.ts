import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

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
        paymentMode,
        status: 'pending',
        receiptNumber,
      }])
      .select()
      .single();
      
    if (paymentError) {
      return NextResponse.json(
        { success: false, message: 'Payment creation failed', error: paymentError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      payment,
    });
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}