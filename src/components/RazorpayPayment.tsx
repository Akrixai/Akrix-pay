'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Loader2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayPaymentProps {
  formData: any;
  onSuccess: (paymentData: any) => void;
  onError: (error: any) => void;
}

export function RazorpayPayment({ formData, onSuccess, onError }: RazorpayPaymentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Check if Razorpay script is already loaded
    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        console.log('✅ Razorpay script loaded successfully');
      };
      script.onerror = () => {
        console.error('❌ Failed to load Razorpay script');
      };
      document.body.appendChild(script);

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, []);

  const initiatePayment = async () => {
    try {
      setIsLoading(true);
      setPaymentStatus('processing');
      setErrorMessage('');

      console.log('🚀 Initiating Razorpay payment with data:', formData);

      // Check if Razorpay is loaded
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded. Please refresh the page and try again.');
      }

      // Create Razorpay order
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const orderData = await response.json();
      console.log('📦 Razorpay order created:', orderData);

      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      // Configure Razorpay options
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Akrix.ai',
        description: 'Payment for services',
        order_id: orderData.orderId,
        handler: async (response: any) => {
          console.log('✅ Payment successful:', response);
          await verifyPayment(response, orderData.paymentId);
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: '#8B5CF6',
        },
        modal: {
          ondismiss: () => {
            console.log('❌ Payment cancelled by user');
            setIsLoading(false);
            setPaymentStatus('failed');
            setErrorMessage('Payment was cancelled');
          },
        },
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error: any) {
      console.error('💥 Payment initiation error:', error);
      setIsLoading(false);
      setPaymentStatus('failed');
      setErrorMessage(error.message);
      onError(error);
    }
  };

  const verifyPayment = async (razorpayResponse: any, paymentId: string) => {
    try {
      console.log('🔍 Verifying payment:', razorpayResponse);

      const verifyResponse = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpayOrderId: razorpayResponse.razorpay_order_id,
          razorpayPaymentId: razorpayResponse.razorpay_payment_id,
          razorpaySignature: razorpayResponse.razorpay_signature,
          paymentId: paymentId,
        }),
      });

      const verifyData = await verifyResponse.json();
      console.log('✅ Payment verification result:', verifyData);

      if (verifyData.success) {
        setPaymentStatus('success');
        setIsLoading(false);
        onSuccess({
          ...verifyData.payment,
          receipt: verifyData.receipt,
          razorpayPaymentId: razorpayResponse.razorpay_payment_id,
          razorpayOrderId: razorpayResponse.razorpay_order_id,
        });
      } else {
        throw new Error(verifyData.message || 'Payment verification failed');
      }
    } catch (error: any) {
      console.error('💥 Payment verification error:', error);
      setIsLoading(false);
      setPaymentStatus('failed');
      setErrorMessage(error.message);
      onError(error);
    }
  };

  return (
    <div className="max-w-2xl w-full mx-auto p-4 sm:p-6 md:p-8 bg-white text-black rounded-lg shadow">
      <div className="mb-4">
        <Link href="/" className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" /></svg>
          Back to Home
        </Link>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-8"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Complete Payment
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Secure payment powered by Razorpay
          </p>
        </div>

        {/* Payment Summary */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Payment Summary
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Customer:</span>
              <span className="text-gray-900 dark:text-white font-medium">{formData.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Email:</span>
              <span className="text-gray-900 dark:text-white">{formData.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Payment Mode:</span>
              <span className="text-gray-900 dark:text-white">{formData.paymentMode}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-4">
              <div className="flex justify-between text-lg font-bold">
                <span className="text-gray-900 dark:text-white">Total Amount:</span>
                <span className="text-primary-600 dark:text-primary-400">
                  ₹{formData.amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        {paymentStatus === 'processing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Processing your payment...</p>
          </motion.div>
        )}

        {paymentStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-green-600 mb-2">Payment Successful!</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your payment has been processed successfully.
            </p>
          </motion.div>
        )}

        {paymentStatus === 'failed' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-red-600 mb-2">Payment Failed</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{errorMessage}</p>
            <button
              onClick={() => {
                setPaymentStatus('idle');
                setErrorMessage('');
              }}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* Pay Now Button */}
        {paymentStatus === 'idle' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={initiatePayment}
            disabled={isLoading}
            className="w-full py-4 bg-gradient-primary text-white rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Pay ₹{formData.amount.toLocaleString('en-IN')} Now
              </>
            )}
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
