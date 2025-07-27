import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, channel, message } = body;
    
    if (!paymentId || !channel || !message) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Fetch payment and user info
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('amount, userId')
      .eq('id', paymentId)
      .single();
      
    if (paymentError || !payment) {
      return NextResponse.json(
        { success: false, message: 'Invalid paymentId', error: paymentError },
        { status: 400 }
      );
    }
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('name, email, phone')
      .eq('id', payment.userId)
      .single();
      
    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: 'User not found', error: userError },
        { status: 400 }
      );
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
      return NextResponse.json(
        { success: false, message: 'Failed to log reminder', error },
        { status: 500 }
      );
    }
    
    if (notificationError) {
      return NextResponse.json(
        { success: false, message: notificationError },
        { status: 200 }
      );
    }
    
    return NextResponse.json(
      { success: true, message: 'Reminder sent and logged successfully' }
    );
  } catch (error: any) {
    console.error('Error sending reminder:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}