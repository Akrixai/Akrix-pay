import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { generateReceiptPDF, ReceiptData } from '@/utils/pdfGenerator';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const receiptSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(1),
  customerAddress: z.string().min(1),
  amount: z.number().min(0.01),
  paymentMode: z.string().min(1),
  serviceType: z.string().min(1),
  description: z.string().optional(),
});

function generateReceiptNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `AKRX-${year}${month}${day}-${random}`;
}

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Set max duration to 60 seconds

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = receiptSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid input', errors: parsed.error.errors },
        { status: 400 }
      );
    }
    
    const { customerName, customerEmail, customerPhone, customerAddress, amount, paymentMode, serviceType, description } = parsed.data;
    
    // Find or create user
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', customerEmail)
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
        .insert([{ name: customerName, email: customerEmail, phone: customerPhone, address: customerAddress }])
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
        status: 'completed',
        receiptNumber,
        serviceType,
        description,
      }])
      .select()
      .single();
    
    if (paymentError) {
      return NextResponse.json(
        { success: false, message: 'Payment creation failed', error: paymentError.message },
        { status: 500 }
      );
    }
    
    // Create receipt record
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .insert([{
        paymentId: payment.id,
        receiptNumber,
        generatedAt: new Date().toISOString(),
      }])
      .select()
      .single();
    
    if (receiptError) {
      return NextResponse.json(
        { success: false, message: 'Receipt creation failed', error: receiptError.message },
        { status: 500 }
      );
    }
    
    // Generate PDF
    const pdfData: ReceiptData = {
      receiptNumber,
      date: new Date().toLocaleDateString('en-IN'),
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      amount,
      paymentMode,
      serviceType,
      status: 'completed',
    };
    
    const pdfBuffer = await generateReceiptPDF(pdfData);
    
    // Create a new Response with the PDF buffer
    const response = new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt-${receiptNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
    
    return response;
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}