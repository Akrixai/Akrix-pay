'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import cashfree from '@/lib/cashfree';

declare global {
  interface Window {
    cashfree: any;
  }
}

interface CashfreePaymentProps {
  formData: any;
  onSuccess: (response: any) => void;
  onError: (error: any) => void;
}

export function CashfreePayment({ formData, onSuccess, onError }: CashfreePaymentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  
  // Handle SDK load event
  const handleScriptLoad = () => {
    console.log('Cashfree SDK loaded successfully');
    setSdkLoaded(true);
    if (orderData) {
      processCashfreeCheckout(orderData);
    }
  };

  // Handle SDK load error
  const handleScriptError = () => {
    console.error('Failed to load Cashfree SDK');
    setErrorMessage('Failed to load payment gateway. Please try again.');
    setPaymentStatus('failed');
    setIsLoading(false);
    onError('Failed to load payment gateway');
  };
  
  useEffect(() => {
    initiatePayment();
  }, []);

  const initiatePayment = async () => {
    try {
      setIsLoading(true);
      setPaymentStatus('processing');
      setErrorMessage('');

      console.log('🚀 Initiating Cashfree payment with data:', formData);

      const response = await fetch('/api/payment/cashfree-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const orderData = await response.json();
      console.log('📦 Cashfree order created:', orderData);

      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to create Cashfree payment order');
      }
      
      // Store order data for processing after SDK loads
      setOrderData(orderData);
      
      // If SDK is already loaded, process checkout
      if (sdkLoaded) {
        processCashfreeCheckout(orderData);
      }

    } catch (error: any) {
      console.error('💥 Cashfree payment initiation error:', error);
      setIsLoading(false);
      setPaymentStatus('failed');
      setErrorMessage(error.message);
      onError(error);
    }
  };

  // Process Cashfree checkout with modal approach
  const processCashfreeCheckout = (orderData: any) => {
    if (!window.cashfree) {
      console.error('Cashfree SDK not loaded properly');
      setPaymentStatus('failed');
      setErrorMessage('Failed to initialize payment gateway');
      onError('Failed to initialize payment gateway');
      return;
    }
    
    if (!orderData.payment_session_id) {
      console.error('Missing payment session ID in order data:', orderData);
      setPaymentStatus('failed');
      setErrorMessage('Failed to initialize payment: Missing payment session ID');
      onError('Failed to initialize payment: Missing payment session ID');
      return;
    }
    
    const cashfreeInstance = window.cashfree({
      mode: cashfree.mode,
    });
    
    const checkoutOptions = {
      paymentSessionId: orderData.payment_session_id,
      redirectTarget: '_modal', // Use modal for in-app experience
    };
    
    console.log('Starting Cashfree checkout with options:', checkoutOptions);
    
    cashfreeInstance.checkout(checkoutOptions)
      .then((result: any) => {
        console.log('Cashfree checkout result:', result);
        if (result.error) {
          setPaymentStatus('failed');
          setErrorMessage(result.error.message || 'Payment failed');
          onError(result.error);
        } else if (result.paymentDetails) {
          setPaymentStatus('success');
          onSuccess(result.paymentDetails);
        }
      })
      .catch((error: any) => {
        console.error('Cashfree checkout error:', error);
        setPaymentStatus('failed');
        setErrorMessage(error.message || 'Payment failed');
        onError(error);
      });
  };

  return (
    <>
      <Script 
        src="https://sdk.cashfree.com/js/v3/cashfree.js"
        strategy="lazyOnload"
        onLoad={handleScriptLoad}
        onError={handleScriptError}
      />
      
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Processing Cashfree Payment</h2>
        {isLoading && <p>Please wait while we process your payment...</p>}
        {paymentStatus === 'success' && (
          <div>
            <p className="text-green-600 font-semibold">Payment Successful!</p>
            <p>Your transaction has been completed.</p>
          </div>
        )}
        {paymentStatus === 'failed' && (
          <div>
            <p className="text-red-600 font-semibold">Payment Failed</p>
            <p>{errorMessage}</p>
          </div>
        )}
      </div>
    </>
  );
}