"use client";

import { useState, useEffect } from 'react';

interface PhonePePaymentProps {
  formData: any;
  onSuccess: (response: any) => void;
  onError: (error: any) => void;
}

export function PhonePePayment({ formData, onSuccess, onError }: PhonePePaymentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    initiatePayment();
  }, []);

  const initiatePayment = async () => {
    try {
      setIsLoading(true);
      setPaymentStatus('processing');
      setErrorMessage('');

      console.log('🚀 Initiating PhonePe payment with data:', formData);

      const response = await fetch('/api/payment/phonepe-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const orderData = await response.json();
      console.log('📦 PhonePe order created:', orderData);

      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to create PhonePe payment order');
      }
      
      const paymentUrl = orderData.data.data.instrumentResponse.redirectInfo.url;
      window.location.href = paymentUrl;

    } catch (error: any) {
      console.error('💥 PhonePe payment initiation error:', error);
      setIsLoading(false);
      setPaymentStatus('failed');
      setErrorMessage(error.message);
      onError(error);
    }
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Processing PhonePe Payment</h2>
      {isLoading && <p>Please wait while we process your payment...</p>}
      {paymentStatus === 'success' && (
        <div>
          <p className="text-green-600 font-semibold">Payment Initiated Successfully!</p>
          <p>You will be redirected shortly.</p>
        </div>
      )}
      {paymentStatus === 'failed' && (
        <div>
          <p className="text-red-600 font-semibold">Payment Initiation Failed</p>
          <p>{errorMessage}</p>
        </div>
      )}
    </div>
  );
} 