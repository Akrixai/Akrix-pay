import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { sendPaymentReminderEmail } from '@/services/emailService';
import twilio from 'twilio';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const twilioSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
const twilioFrom = process.env.TWILIO_WHATSAPP_FROM;
const twilioClient = twilioSid && twilioAuth ? twilio(twilioSid, twilioAuth) : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  const { paymentId, channel, message } = req.body;
  if (!paymentId || !channel || !message) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  // Fetch payment and user info
  const { data: payment, error: paymentError } = await supabase.from('payments').select('amount, userId').eq('id', paymentId).single();
  if (paymentError || !payment) {
    return res.status(400).json({ success: false, message: 'Invalid paymentId', error: paymentError } );
  }
  const { data: user, error: userError } = await supabase.from('users').select('name, email, phone').eq('id', payment.userId).single();
  if (userError || !user) {
    return res.status(400).json({ success: false, message: 'User not found', error: userError });
  }
  let notificationError = null;
  if (channel === 'email') {
    try {
      await sendPaymentReminderEmail(user.email, user.name, payment.amount, message);
    } catch (err: any) {
      notificationError = err.message || 'Failed to send email';
      console.error('Email reminder error:', err);
    }
  } else if (channel === 'whatsapp') {
    if (!twilioClient || !twilioFrom) {
      notificationError = 'Twilio not configured';
      console.error('Twilio not configured');
    } else {
      try {
        await twilioClient.messages.create({
          from: `whatsapp:${twilioFrom}`,
          to: `whatsapp:${user.phone}`,
          body: `Hi ${user.name},\n\nThis is a payment reminder from Akrix. Amount due: ₹${payment.amount.toLocaleString('en-IN')}\n${message}`,
        });
      } catch (err: any) {
        notificationError = err.message || 'Failed to send WhatsApp message';
        console.error('WhatsApp reminder error:', err);
      }
    }
  }
  // Log the reminder in Supabase
  const { error } = await supabase.from('reminders').insert([{
    paymentid: paymentId,
    channel,
    message,
    status: notificationError ? 'error' : 'sent',
    sentat: new Date().toISOString(),
  }]);
  if (error) {
    console.error('Supabase insert error:', error);
    return res.status(500).json({ success: false, message: 'Failed to log reminder', error });
  }
  if (notificationError) {
    return res.status(200).json({ success: false, message: notificationError });
  }
  return res.status(200).json({ success: true, message: 'Reminder sent and logged successfully' });
} 