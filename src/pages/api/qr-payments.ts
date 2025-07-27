import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';
import { generateReceiptPDF } from '@/utils/pdfGenerator';
import { sendReceiptToClient } from '@/services/emailService';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { name, email, phone, amount, utr } = req.body;
    if (!name || !email || !phone || !amount || !utr) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const { data, error } = await supabase.from('qr_payments').insert([{ name, email, phone, amount, utr }]).select().single();
    if (error) return res.status(500).json({ success: false, message: error.message });
    return res.status(200).json({ success: true, payment: data });
  }
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('qr_payments').select('*').order('createdAt', { ascending: false });
    if (error) return res.status(500).json({ success: false, message: error.message });
    return res.status(200).json({ success: true, payments: data });
  }
  if (req.method === 'PATCH') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, message: 'Missing payment id' });
    // Update status
    const { data, error } = await supabase.from('qr_payments').update({ payment_status: 'approved' }).eq('id', id).select().single();
    if (error) return res.status(500).json({ success: false, message: error.message });
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
    return res.status(200).json({ success: true, payment: data });
  }
  res.setHeader('Allow', ['POST', 'GET']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}