import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { generateReceiptPDF } from '@/utils/pdfGenerator';
import { sendReceiptToClient } from '@/services/emailService';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, amount, utr } = await request.json();
    if (!name || !email || !phone || !amount || !utr) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }
    const { data, error } = await supabase.from('qr_payments').insert([{ name, email, phone, amount, utr }]).select().single();
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    return NextResponse.json({ success: true, payment: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase.from('qr_payments').select('*').order('createdAt', { ascending: false });
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    return NextResponse.json({ success: true, payments: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ success: false, message: 'Missing payment id' }, { status: 400 });
    // Update status
    const { data, error } = await supabase.from('qr_payments').update({ payment_status: 'approved' }).eq('id', id).select().single();
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    // Generate PDF and send email
    try {
      // Generate receipt number
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
      const receiptNumber = `AKRX-QR-${year}${month}${day}-${random}`;
      const pdfBuffer = await generateReceiptPDF({
        receiptNumber,
        date: date.toLocaleDateString('en-IN'),
        customerName: data.name,
        customerEmail: data.email,
        customerPhone: data.phone,
        customerAddress: 'N/A',
        amount: data.amount,
        paymentMode: 'QR',
        status: 'approved',
      });
      await sendReceiptToClient(data.email, data.name, data.amount, pdfBuffer, receiptNumber);
    } catch (e) {
      // Optionally handle email/PDF errors
    }
    return NextResponse.json({ success: true, payment: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}