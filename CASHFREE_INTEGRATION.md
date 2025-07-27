# Cashfree Payment Gateway Integration

## Overview

This document provides information about the Cashfree payment gateway integration in the AkrixPay application. Cashfree is now available as a payment option alongside Razorpay and PhonePe.

## Configuration

### Environment Variables

The following environment variables are required for Cashfree integration:

```
CASHFREE_APP_ID=1015546594b43447fabcd372e2c6455101
CASHFREE_SECRET_KEY=cfsk_ma_prod_c834995978c8ff70fa825c2e0dfe7b8b_44866fab
CASHFREE_ENV=production  # Set to 'sandbox' for testing or 'production' for live transactions
```

These have been added to the `.env` and `.env.example` files.

## Implementation Details

### Frontend Components

1. **CashfreePayment.tsx**: A React component that handles the Cashfree payment flow. It:
   - Loads the Cashfree JavaScript SDK
   - Initiates the payment by making a POST request to the `/api/payment/cashfree-order` endpoint
   - Uses the Cashfree SDK to open the payment page with the payment session ID
   - Falls back to direct redirect if the SDK fails to load

### Backend API Endpoints

1. **cashfree-order.ts**: Creates a Cashfree order and returns the payment details. It handles:
   - Validating the payment data
   - Creating or finding the user in the database
   - Creating a payment record in the database
   - Generating a Cashfree order using the Cashfree API
   - Returning the payment session ID, order ID, and payment link to the frontend

2. **cashfree-callback.ts**: Handles the webhook callback from Cashfree after payment completion. It:
   - Verifies the webhook signature
   - Updates the payment status in the database
   - Generates a receipt for successful payments

## Payment Flow

1. User fills out the payment form on the online payment page
2. User selects Cashfree as the payment gateway
3. The CashfreePayment component initiates the payment by calling the cashfree-order API
4. The user is redirected to the Cashfree payment page
5. After payment completion, Cashfree redirects the user back to the application
6. Cashfree also sends a webhook notification to the cashfree-callback API
7. The payment status is updated in the database
8. For successful payments, a receipt is generated and sent to the user's email

## Testing

To test the Cashfree integration:

1. Make sure the environment variables are correctly set
2. Start the application with `npm run dev`
3. Navigate to the online payment page
4. Fill out the payment form
5. Select Cashfree as the payment gateway
6. Complete the payment flow

## Production Considerations

- The implementation now supports both sandbox and production environments through the `CASHFREE_ENV` environment variable
- Set `CASHFREE_ENV=production` for live transactions or `CASHFREE_ENV=sandbox` for testing
- If `CASHFREE_ENV` is not set, the system defaults to production mode
- Make sure to update the returnUrl and notifyUrl in the cashfree-order.ts file with the production URLs when deploying to production
- **IMPORTANT**: Cashfree requires all callback URLs to use HTTPS protocol. The code automatically converts HTTP to HTTPS, but your server must support HTTPS for callbacks to work properly
- Ensure that the webhook endpoint is publicly accessible for Cashfree to send payment notifications
- Use appropriate Cashfree credentials for each environment (sandbox credentials for testing, production credentials for live)

## Troubleshooting

If you encounter issues with the Cashfree integration:

1. Check the console logs for any errors
2. Verify that the environment variables are correctly set
3. Ensure that the Cashfree API endpoints are accessible from your server
4. Check the Cashfree dashboard for payment status and error messages
5. Ensure that all callback URLs (return_url and notify_url) use HTTPS protocol, as Cashfree rejects HTTP URLs
   - The code automatically converts HTTP URLs to HTTPS, but your server must support HTTPS for callbacks to work properly