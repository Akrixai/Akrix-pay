import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { generateReceiptPDF, ReceiptData } from '@/utils/pdfGenerator';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  const { receiptId } = req.query;
  if (!receiptId || typeof receiptId !== 'string') {
    return res.status(400).json({ success: false, message: 'Missing or invalid receiptId' });
  }
  // Fetch receipt, payment, and user
  const { data: receipt, error: receiptError } = await supabase
    .from('receipts')
    .select('*, payment(*, user(*))')
    .eq('id', receiptId)
    .single();
  if (receiptError || !receipt) {
    return res.status(404).json({ success: false, message: 'Receipt not found' });
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
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="receipt-${pdfData.receiptNumber}.pdf"`);
  res.setHeader('Content-Length', pdfBuffer.length);
  res.send(pdfBuffer);
} 