import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateReceiptPDF, ReceiptData } from '@/utils/pdfGenerator';
import { sendReceiptToClient, sendPaymentNotificationToAkrix } from '@/services/emailService';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Set max duration to 60 seconds

export async function POST(request: NextRequest, { params }: { params: { receiptId: string } }) {
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
    
    try {
      await sendReceiptToClient(user.email, user.name, payment.amount, pdfBuffer, pdfData.receiptNumber);
      await sendPaymentNotificationToAkrix(user.name, user.email, payment.amount, pdfBuffer, pdfData.receiptNumber);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Receipt emails sent successfully to both client and Akrix' 
      });
    } catch (emailError: any) {
      console.error('Error sending email:', emailError);
      return NextResponse.json(
        { success: false, message: 'Failed to send email', error: emailError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in receipt email API:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}