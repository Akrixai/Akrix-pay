import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateReceiptPDF, ReceiptData } from '@/utils/pdfGenerator';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Set max duration to 60 seconds

export async function GET(request: NextRequest, { params }: { params: { paymentId: string } }) {
  try {
    const paymentId = params.paymentId;

    if (!paymentId) {
      return NextResponse.json(
        { success: false, message: 'Missing or invalid paymentId' },
        { status: 400 }
      );
    }
    
    // Fetch payment, user, and receipt
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*, user(*), receipt(*)')
      .eq('id', paymentId)
      .single();
    
    if (paymentError || !payment) {
      console.error('Error fetching payment:', paymentError);
      return NextResponse.json(
        { success: false, message: 'Payment not found' },
        { status: 404 }
      );
    }
    
    const user = payment.user;
    const receipt = payment.receipt && payment.receipt[0] ? payment.receipt[0] : null;
    
    const pdfData: ReceiptData = {
      receiptNumber: receipt ? receipt.receiptNumber : payment.receiptNumber,
      date: new Date(payment.createdAt).toLocaleDateString('en-IN'),
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: user.phone,
      customerAddress: user.address,
      amount: payment.amount,
      paymentMode: payment.paymentMode,
      paymentId: payment.razorpayPaymentId || undefined,
      orderId: payment.razorpayOrderId || undefined,
      status: payment.status,
    };
    
    const pdfBuffer = await generateReceiptPDF(pdfData);
    
    // Create a new Response with the PDF buffer
    const response = new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt-${pdfData.receiptNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
    
    return response;
  } catch (error: any) {
    console.error('Error generating receipt PDF:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate receipt PDF', error: error.message },
      { status: 500 }
    );
  }
}