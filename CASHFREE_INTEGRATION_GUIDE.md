# Cashfree Payment Integration Guide

This guide explains how to use the Cashfree payment integration in the AkrixPay application.

## Overview

The integration uses Cashfree's Payment Gateway (PG) API to process payments. The flow is as follows:

1. User fills out payment form with amount and personal details
2. Backend creates a Cashfree order
3. Frontend initializes Cashfree checkout using the order token
4. User completes payment in the Cashfree checkout interface
5. Cashfree redirects to success page and sends webhook notification
6. Backend verifies payment and updates payment status

## Implementation Details

### API Routes

- `/api/create-order`: Creates a new Cashfree order
- `/api/webhook`: Handles Cashfree webhook notifications
- `/api/payment/verify`: Verifies payment status

### Components

- `PaymentForm`: Collects payment details and initializes Cashfree checkout
- `PaymentSuccessPage`: Displays payment result

## Environment Variables

Make sure the following environment variables are set in your `.env.local` file:

```
# Test Environment (Recommended for development)
CASHFREE_APP_ID=TEST10707286df937d7a99046d87a8ee68270701
CASHFREE_SECRET_KEY=cfsk_ma_test_38ae814dc9009e95888f0e5e0c5ff1ce_b0347ad9
CASHFREE_ENV=sandbox
NEXT_PUBLIC_CASHFREE_APP_ID=TEST10707286df937d7a99046d87a8ee68270701

# Production Environment (Only use after thorough testing)
# CASHFREE_APP_ID=your_production_app_id
# CASHFREE_SECRET_KEY=your_production_secret_key
# CASHFREE_ENV=production
# NEXT_PUBLIC_CASHFREE_APP_ID=your_production_app_id

NEXT_PUBLIC_APP_URL=your_app_url  # MUST be an HTTPS URL for production
```

### IMPORTANT: HTTPS Requirement

Cashfree requires all callback URLs (return_url and notify_url) to use HTTPS. For local development:

1. The code is configured to use a fallback production URL for callbacks
2. You can use a secure tunnel service like ngrok to expose your local server via HTTPS
3. For testing, you can deploy to a staging environment with HTTPS support

## Testing

### Test Environment

The application is now configured to use Cashfree's sandbox (test) environment with the following credentials:

```
App ID: TEST10707286df937d7a99046d87a8ee68270701
Secret Key: cfsk_ma_test_38ae814dc9009e95888f0e5e0c5ff1ce_b0347ad9
```

This allows you to test the payment flow without processing actual payments.

### Test Cards

For testing in the sandbox environment, you can use Cashfree's test cards:

- Card Number: 4111 1111 1111 1111
- Expiry: Any future date (MM/YY)
- CVV: Any 3-digit number
- Name: Any name
- OTP: 123456

### Test UPI

For UPI testing:
- UPI ID: success@upi
- For successful payments

- UPI ID: failure@upi
- For failed payments

## Webhook Configuration

In your Cashfree dashboard, configure the webhook URL to point to:

```
{your_app_url}/api/webhook
```

## Troubleshooting

### Common Issues

1. **Payment Initialization Failed**: Check if Cashfree credentials are correct
2. **Webhook Not Received**: Verify webhook URL is correctly configured in Cashfree dashboard
3. **Payment Status Not Updated**: Check database connection and webhook handler

### Debugging

Check the browser console and server logs for error messages. The integration includes detailed logging to help diagnose issues.

## Production Considerations

1. Implement proper error handling and retry mechanisms
2. Add webhook signature verification for security
3. Set up monitoring for payment failures
4. Implement proper receipt generation and email notifications