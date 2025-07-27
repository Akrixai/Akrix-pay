'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import PaymentStatus from '@/components/payments/PaymentStatus';
import { Loader2 } from 'lucide-react';

export default function PaymentStatusPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [verificationMessage, setVerificationMessage] = useState('');

  // Extract parameters from URL
  const status = searchParams.get('status');
  const orderId = searchParams.get('order_id');
  const paymentId = searchParams.get('payment_id');
  const gateway = searchParams.get('gateway');
  const errorMessage = searchParams.get('error_message');
  const errorCode = searchParams.get('error_code');
  const errorDescription = searchParams.get('error_description');
  const networkError = searchParams.get('network_error') === 'true';

  useEffect(() => {
    // If status is explicitly provided in URL, use that instead of verifying
    if (status && (status === 'success' || status === 'failed' || status === 'pending' || status === 'cancelled')) {
      setVerificationStatus(status === 'success' ? 'success' : status === 'failed' ? 'failed' : 'loading');
      fetchPaymentDetails();
      return;
    }
    
    // Otherwise verify the payment status with backend
    if (orderId) {
      verifyPayment();
    } else {
      setVerificationStatus('failed');
      setVerificationMessage('Invalid payment information. Missing order ID.');
      setLoading(false);
    }
  }, [searchParams]);

  const verifyPayment = async () => {
    try {
      const response = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          gateway: gateway || 'cashfree',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setVerificationStatus('success');
        setVerificationMessage(data.message || 'Payment completed successfully!');
      } else {
        setVerificationStatus('failed');
        setVerificationMessage(data.message || 'Payment verification failed. Please contact support.');
      }
      
      // After verification, fetch payment details
      fetchPaymentDetails();
    } catch (error) {
      console.error('Error verifying payment:', error);
      setVerificationStatus('failed');
      setVerificationMessage('An error occurred while verifying your payment. Please contact support.');
      setLoading(false);
    }
  };

  const fetchPaymentDetails = async () => {
    // Only fetch payment details for successful payments
    if ((verificationStatus === 'success' || status === 'success') && (orderId || paymentId)) {
      try {
        // Construct query parameters
        const params = new URLSearchParams();
        if (orderId) params.append('order_id', orderId);
        if (paymentId) params.append('payment_id', paymentId);
        
        const response = await fetch(`/api/payment/details?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch payment details');
        }
        
        const data = await response.json();
        
        if (data.payment) {
          setPaymentData(data.payment);
        }
        
        if (data.receipt) {
          setReceiptData(data.receipt);
        }
      } catch (err) {
        console.error('Error fetching payment details:', err);
        setError('Failed to load payment details');
      }
    }
    
    setLoading(false);
  };

  // Determine the payment status to display
  const getDisplayStatus = () => {
    if (loading) return 'loading';
    if (error) return 'error';
    if (status === 'success' || verificationStatus === 'success') return 'success';
    if (status === 'failed' || verificationStatus === 'failed') return 'failed';
    if (status === 'pending') return 'pending';
    if (status === 'cancelled') return 'cancelled';
    return 'error';
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold text-center mb-8">
        {getDisplayStatus() === 'success' ? 'Payment Successful' : 
         getDisplayStatus() === 'failed' ? 'Payment Failed' : 
         getDisplayStatus() === 'pending' ? 'Payment Pending' : 
         getDisplayStatus() === 'cancelled' ? 'Payment Cancelled' : 
         getDisplayStatus() === 'loading' ? 'Processing Payment' : 'Payment Status'}
      </h1>
      
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardContent className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-500">Verifying payment status...</p>
            </div>
          ) : (
            <PaymentStatus 
              status={getDisplayStatus()}
              orderId={orderId || undefined}
              paymentId={paymentId || undefined}
              receiptId={receiptData?.id || undefined}
              amount={paymentData?.amount || undefined}
              paymentMethod={paymentData?.payment_mode || gateway || undefined}
              date={paymentData?.created_at || undefined}
              customerName={paymentData?.customer_name || receiptData?.customer_name || undefined}
              customerEmail={paymentData?.customer_email || receiptData?.customer_email || undefined}
              customerPhone={paymentData?.customer_phone || receiptData?.customer_phone || undefined}
              errorMessage={errorMessage || verificationMessage || undefined}
              errorCode={errorCode || undefined}
              errorDescription={errorDescription || undefined}
              networkError={networkError}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}