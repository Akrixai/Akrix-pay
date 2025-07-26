import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const clientSecret = process.env.PHONEPE_CLIENT_SECRET!;
const clientVersion = parseInt(process.env.PHONEPE_CLIENT_VERSION || "1");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { response: base64Response } = req.body;
    const decodedResponse = JSON.parse(Buffer.from(base64Response, 'base64').toString('utf-8'));
    
    const { code, merchantId, merchantTransactionId, transactionId } = decodedResponse;

    const xVerify = req.headers['x-verify'] as string;
    const checksum = crypto.createHash('sha256').update(base64Response + clientSecret).digest('hex') + '###' + clientVersion;

    if (xVerify !== checksum) {
      return res.status(400).json({ success: false, message: 'Invalid checksum' });
    }

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('receiptNumber', merchantTransactionId)
      .single();

    if (paymentError || !payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    
    if (code === 'PAYMENT_SUCCESS') {
      await supabase
        .from('payments')
        .update({ status: 'completed', phonepeTransactionId: transactionId })
        .eq('id', payment.id);
    } else {
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('id', payment.id);
    }
    
    // Redirect to a success or failure page
    res.redirect(302, `/customer/payments?status=${code}`);

  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
} 