import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateReceiptPDF, ReceiptData } from '@/utils/pdfGenerator';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Set max duration to 60 seconds

export async function GET(request: NextRequest, { params }: { params: { receiptId: string } }) {
  try {
    const receiptId = params.receiptId;

    if (!receiptId) {
      return NextResponse.json(
        { success: false, message: 'Missing or invalid receiptId' },
        { status: 400 }
      );
    }
    
    // Fetch receipt, payment, and user
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .select('*, payment(*, user(*))')
      .eq('id', receiptId)
      .single();
    
    if (receiptError || !receipt) {
      console.error('Error fetching receipt:', receiptError);
      return NextResponse.json(
        { success: false, message: 'Receipt not found' },
        { status: 404 }
      );
    }
    
    const payment = receipt.payment;
    const user = payment.user;
    
    const pdfData: ReceiptData = {
      receiptNumber: receipt.receiptNumber || payment.receiptNumber,
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