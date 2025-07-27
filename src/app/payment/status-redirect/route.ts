import { NextRequest, NextResponse } from 'next/server';

/**
 * This route handles redirecting to the appropriate payment status page
 * based on the payment status parameters in the URL.
 * 
 * Note: This route was moved to /payment/status-redirect to avoid conflict with the page.tsx in the /payment/status directory.
 * The route is now accessible at /payment/status-redirect instead of /payment/status
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const orderId = searchParams.get('order_id');
  const paymentId = searchParams.get('payment_id');
  const errorMessage = searchParams.get('error_message');
  const errorCode = searchParams.get('error_code');
  const gateway = searchParams.get('gateway');
  
  // Build the redirect URL with all parameters
  let redirectUrl: string;
  
  if (status === 'success') {
    redirectUrl = `/payment/success?order_id=${orderId || ''}`;
    if (paymentId) redirectUrl += `&payment_id=${paymentId}`;
    if (gateway) redirectUrl += `&gateway=${gateway}`;
  } else {
    redirectUrl = `/payment/failure?error_message=${encodeURIComponent(errorMessage || 'Payment failed')}`;
    if (errorCode) redirectUrl += `&error_code=${errorCode}`;
    if (orderId) redirectUrl += `&order_id=${orderId}`;
    if (gateway) redirectUrl += `&gateway=${gateway}`;
  }
  
  return NextResponse.redirect(new URL(redirectUrl, request.nextUrl.origin));
}