/**
 * Cashfree configuration file
 * This file centralizes Cashfree payment gateway configuration
 */
const cashfree = {
  mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox',
  appId: process.env.NEXT_PUBLIC_CASHFREE_APP_ID,
  secretKey: process.env.CASHFREE_SECRET_KEY
};

export default cashfree;