import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { PaymentStatus } from '@/types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Define the request schema
const requestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must not exceed 15 digits')
    .refine(val => /^\+?[0-9]{10,15}$/.test(val), {
      message: 'Phone number must contain only digits with an optional + prefix'
    })
    .transform(val => val.replace(/[^\d+]/g, '')), // Clean the phone number during validation
  address: z.string().optional(),
  amount: z.number().min(1, 'Amount must be at least 1'),
  paymentMode: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await request.json();
    const validatedData = requestSchema.parse(body);

    // Find or create user
    let userId;
    console.log(`Processing payment for email: ${validatedData.email}`);
    
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', validatedData.email)
      .single();

    if (existingUser) {
      console.log(`User exists with ID: ${existingUser.id}, updating information`);
      userId = existingUser.id;
      // Update user information
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: validatedData.name,
          phone: validatedData.phone,
          mobile: validatedData.phone, // Set mobile field with phone value
          address: validatedData.address,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', userId);
        
      if (updateError) {
        console.error('Error updating user:', updateError);
        return NextResponse.json(
          { error: 'Failed to update user information', details: updateError.message },
          { status: 500 }
        );
      }
      
      console.log(`Successfully updated user: ${userId}`);
    } else {
      // Create new user
      console.log(`User does not exist, creating new user with email: ${validatedData.email}`);
      
      try {
        // First check if user already exists to avoid duplicate key error
        const { data: existingUserCheck, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('email', validatedData.email)
          .single();
          
        if (existingUserCheck) {
          // User already exists, use this ID
          console.log(`User already exists with ID: ${existingUserCheck.id}, using existing user`);
          userId = existingUserCheck.id;
          
          // Update user information
          const { error: updateError } = await supabase
            .from('users')
            .update({
              name: validatedData.name,
              phone: validatedData.phone,
              mobile: validatedData.phone,
              address: validatedData.address,
              updatedAt: new Date().toISOString(),
            })
            .eq('id', userId);
            
          if (updateError) {
            console.error('Error updating existing user:', updateError);
            return NextResponse.json(
              { error: 'Failed to update user information', details: updateError.message },
              { status: 500 }
            );
          }
          
          console.log(`Successfully updated existing user: ${userId}`);
        } else {
          // User doesn't exist, create new user
          const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert({
              id: uuidv4(),
              name: validatedData.name,
              email: validatedData.email,
              phone: validatedData.phone,
              mobile: validatedData.phone, // Set mobile field with phone value
              address: validatedData.address,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
            .select('id')
            .single();

          if (userError) {
            console.error('Error creating user:', userError);
            
            // If the error is a duplicate key violation (email already exists)
            if (userError.code === '23505' && userError.message.includes('email')) {
              console.log(`Duplicate email detected: ${validatedData.email}, fetching existing user ID`);
              // Try to fetch the existing user
              const { data: existingUser, error: fetchError } = await supabase
                .from('users')
                .select('id')
                .eq('email', validatedData.email)
                .single();
              
              if (fetchError) {
                console.error('Error fetching existing user:', fetchError);
                return NextResponse.json(
                  { error: 'Failed to find existing user', details: fetchError.message },
                  { status: 500 }
                );
              }
            
              if (existingUser) {
                console.log(`Found existing user with ID: ${existingUser.id} after duplicate email detection`);
                // Use the existing user's ID
                userId = existingUser.id;
                
                // Update user information
                const { error: updateError } = await supabase
                  .from('users')
                  .update({
                    name: validatedData.name,
                    phone: validatedData.phone,
                    mobile: validatedData.phone,
                    address: validatedData.address,
                    updatedAt: new Date().toISOString(),
                  })
                  .eq('id', userId);
                  
                if (updateError) {
                  console.error('Error updating existing user after duplicate detection:', updateError);
                  return NextResponse.json(
                    { 
                      error: 'Failed to update existing user', 
                      details: updateError.message,
                      message: 'Found existing user but failed to update their information'
                    },
                    { status: 500 }
                  );
                }
                
                console.log(`Successfully updated existing user: ${userId} after duplicate email detection`);
              } else {
                // If we can't find the user despite the duplicate key error
                console.error('Could not find user despite duplicate email error');
                return NextResponse.json(
                  { error: 'Failed to create or find user with duplicate email' },
                  { status: 500 }
                );
              }
            } else {
              // For other types of errors
              return NextResponse.json(
                { error: 'Failed to create user', details: userError.message },
                { status: 500 }
              );
            }
          }

          // Only set userId from newUser if we actually created a new user
          // (if we handled a duplicate email error, userId is already set above)
          if (newUser) {
            console.log(`Successfully created new user with ID: ${newUser.id}`);
            userId = newUser.id;
          }
        }
      } catch (unexpectedError) {
        console.error('Unexpected error during user creation:', unexpectedError);
        
        // Last attempt to find user by email if creation failed
        console.log(`Attempting final lookup for user with email: ${validatedData.email}`);
        const { data: lastResortUser, error: lastResortError } = await supabase
          .from('users')
          .select('id')
          .eq('email', validatedData.email)
          .single();
          
        if (lastResortError || !lastResortUser) {
          console.error('Final lookup failed:', lastResortError);
          return NextResponse.json(
            { 
              error: 'Critical error during user processing', 
              details: unexpectedError,
              message: 'Could not create or find user' 
            },
            { status: 500 }
          );
        }
        
        console.log(`Final lookup successful, found user ID: ${lastResortUser.id}`);
        userId = lastResortUser.id;
      }
    }

    // Generate a unique receipt number
    const receiptNumber = `AKRIX-${Date.now()}`;
    
    console.log(`Creating payment record for user ID: ${userId}, amount: ${validatedData.amount}`);

    // Create payment record
    const paymentId = uuidv4();
    let { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        id: paymentId,
        userId: userId,
        amount: validatedData.amount,
        paymentMode: validatedData.paymentMode,
        status: PaymentStatus.PENDING,
        receiptNumber: receiptNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();
      
    console.log(`Payment record created with ID: ${paymentId}, receipt number: ${receiptNumber}`);


    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      return NextResponse.json(
        { 
          error: 'Failed to create payment record', 
          details: paymentError.message,
          code: paymentError.code || 'UNKNOWN'
        },
        { status: 500 }
      );
    }
    
    if (!payment) {
      console.error('Payment record created but no data returned');
      // Try to fetch the payment we just created
      const { data: fetchedPayment, error: fetchError } = await supabase
        .from('payments')
        .select()
        .eq('id', paymentId)
        .single();
        
      if (fetchError || !fetchedPayment) {
        console.error('Failed to fetch created payment:', fetchError);
        return NextResponse.json(
          { error: 'Payment created but could not be retrieved' },
          { status: 500 }
        );
      }
      
      console.log(`Successfully fetched payment record: ${fetchedPayment.id}`);
      // Use the fetched payment
      payment = fetchedPayment;
    }

    // Prepare data for Cashfree order
    const orderId = `order_${Date.now()}`;
    const orderAmount = validatedData.amount;
    const orderCurrency = 'INR';

    // Set the Cashfree API base URL based on environment
    const cashfreeEnv = process.env.CASHFREE_ENV || 'production';
    const cashfreeBaseUrl = cashfreeEnv === 'production'
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';

    // Construct the Cashfree order payload
    // Cashfree requires HTTPS URLs for callbacks
    // For local development, we can use a secure tunnel service like ngrok or use a mock URL
    // In production, ensure NEXT_PUBLIC_APP_URL is set to an HTTPS URL
    const appUrl = process.env.CASHFREE_ENV === 'production' 
      ? (process.env.NEXT_PUBLIC_APP_URL || 'https://akrixpay.vercel.app')
      : 'https://akrixpay.vercel.app'; // Use a secure URL even in development
    
    // Format phone number to ensure it's valid for Cashfree
    // The phone number should already be cleaned by the zod schema transform
    // But let's ensure it's properly formatted for Cashfree
    let formattedPhone = validatedData.phone;
    
    // Ensure the phone number is properly formatted (10-15 digits with optional + prefix)
    // First, clean the phone number to remove any non-digit characters except leading +
    if (formattedPhone.startsWith('+')) {
      // If it starts with +, keep the + and remove any non-digits
      formattedPhone = '+' + formattedPhone.substring(1).replace(/\D/g, '');
    } else {
      // If no +, just remove any non-digits
      formattedPhone = formattedPhone.replace(/\D/g, '');
    }
    
    // Log the formatted phone number for debugging
    console.log(`Original phone: ${validatedData.phone}, Formatted phone: ${formattedPhone}`);
    
    // Validate the formatted phone number length
    if (formattedPhone.replace(/^\+/, '').length < 10 || formattedPhone.replace(/^\+/, '').length > 15) {
      console.error('Invalid phone number length after formatting:', formattedPhone);
      return NextResponse.json(
        { error: 'Invalid phone number format. Phone number must be between 10-15 digits.' },
        { status: 400 }
      );
    }
    
    const orderPayload = {
      order_id: orderId,
      order_amount: orderAmount,
      order_currency: orderCurrency,
      customer_details: {
        customer_id: userId,
        customer_name: validatedData.name,
        customer_email: validatedData.email,
        customer_phone: formattedPhone,
      },
      order_meta: {
        return_url: `${appUrl}/payment/status?order_id=${orderId}`,
        notify_url: `${appUrl}/api/webhook`,
      },
    };

    // Make the API call to Cashfree with retry logic
    try {
      console.log(`Making Cashfree API call for order: ${orderId}`);
      
      // Add retry logic for network issues
      const makeRequestWithRetry = async (retries = 3, delay = 1000) => {
        try {
          console.log(`Cashfree API attempt (retries left: ${retries})`);
          console.log(`Cashfree API payload: ${JSON.stringify(orderPayload)}`);
          
          return await axios.post(
            `${cashfreeBaseUrl}/orders`,
            orderPayload,
            {
              headers: {
                'x-api-version': '2022-09-01',
                'x-client-id': process.env.CASHFREE_APP_ID,
                'x-client-secret': process.env.CASHFREE_SECRET_KEY,
                'Content-Type': 'application/json',
              },
              // Add timeout to prevent hanging requests
              timeout: 10000, // 10 seconds
            }
          );
        } catch (error) {
          console.error(`Cashfree API error: ${error.message}`);
          console.error(`Cashfree API error details: ${JSON.stringify(error.response?.data || {})}`);
          
          if (retries > 0 && (error.message.includes('fetch failed') || error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT')) {
            console.log(`Retrying Cashfree API call. Attempts remaining: ${retries-1}`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return makeRequestWithRetry(retries - 1, delay * 1.5);
          }
          throw error;
        }
      };
      
      const response = await makeRequestWithRetry();
      
      if (!response || !response.data) {
        console.error('Cashfree API returned empty response');
        return NextResponse.json(
          { error: 'Empty response from Cashfree API' },
          { status: 500 }
        );
      }
      
      if (!response.data.payment_session_id) {
        console.error('Cashfree API response missing payment_session_id:', response.data);
        return NextResponse.json(
          { error: 'Invalid response from Cashfree API', details: 'Missing payment_session_id' },
          { status: 500 }
        );
      }

      // Update the payment record with Cashfree order ID
      console.log(`Updating payment record ${payment.id} with Cashfree order ID: ${orderId}`);
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          cashfreeorderid: orderId,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', payment.id);
        
      if (updateError) {
        console.error('Error updating payment record with Cashfree order ID:', updateError);
        // Continue anyway since the Cashfree order was created successfully
        console.warn('Continuing despite payment record update error');
      }

      // Log the Cashfree API response for debugging
      console.log('Cashfree API response:', JSON.stringify(response.data));
      
      // Return the Cashfree order details
      const responseData = {
        success: true,
        cf_order_id: orderId,
        payment_session_id: response.data.payment_session_id,
        payment_link: response.data.payment_link,
      };
      
      console.log('Returning successful response to client:', JSON.stringify(responseData));
      
      return NextResponse.json(responseData);
    } catch (error) {
      console.error('Cashfree API error:', error.message);
      console.error('Cashfree API error details:', error.response?.data);
      
      // Update payment record to indicate failure
      try {
        if (payment && payment.id) {
          console.log(`Updating payment record ${payment.id} to indicate Cashfree API failure`);
          await supabase
            .from('payments')
            .update({
              status: PaymentStatus.FAILED,
              updatedAt: new Date().toISOString(),
            })
            .eq('id', payment.id);
        }
      } catch (updateError) {
        console.error('Error updating payment status to failed:', updateError);
      }
      
      // Prepare detailed error response
      const errorDetails = {
        message: error.message,
        response: error.response?.data,
        code: error.code || 'UNKNOWN',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
      
      console.error('Returning error response to client:', JSON.stringify({
        error: 'Failed to create Cashfree order',
        details: errorDetails,
      }));
      
      return NextResponse.json(
        {
          error: 'Failed to create Cashfree order',
          details: errorDetails,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}