"use client";

import { useState, useEffect } from 'react';
import { RazorpayPayment } from '@/components/RazorpayPayment';
import { PhonePePayment } from '@/components/PhonePePayment';
import CashfreePayment from '@/components/payments/CashfreePayment';
import { MultiStepForm } from '@/components/MultiStepForm';
import NetworkStatus from '@/components/NetworkStatus';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type PaymentGateway = 'razorpay' | 'phonepe' | 'cashfree';

export default function OnlinePaymentPage() {
  const [mobile, setMobile] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<any>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const mob = typeof window !== 'undefined' ? localStorage.getItem('clientMobile') : null;
    setMobile(mob);
    setLoading(false);
    if (!mob) {
      router.replace('/login');
    }
  }, [router]);

  const handleFormSubmit = (data: any) => {
    setFormData(data);
  };

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    setPaymentError(null);
  };

  const handlePaymentError = (error: any) => {
    setPaymentError(error?.message || 'Payment failed. Please try again.');
    // Increment retry count to track failures
    setRetryCount(prev => prev + 1);
  };

  const handleGatewaySelection = (gateway: PaymentGateway) => {
    setSelectedGateway(gateway);
    // Reset error state when selecting a new gateway
    setPaymentError(null);
  };

  const resetPaymentFlow = () => {
    setFormData(null);
    setPaymentSuccess(false);
    setPaymentError(null);
    setSelectedGateway(null);
    setRetryCount(0);
  };
  
  // Handle network status changes
  const handleNetworkChange = (online: boolean) => {
    setIsOnline(online);
    // If we're back online and there was a payment error, show a message
    if (online && paymentError && paymentError.includes('network')) {
      // Clear the error to allow retry
      setPaymentError(null);
    }
  };
  
  // Function to retry the current payment
  const retryPayment = () => {
    setPaymentError(null);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xl">Loading...</div>;
  }
  if (!mobile) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950">
      {/* Network status monitor */}
      <NetworkStatus onNetworkChange={handleNetworkChange} />
      
      <div className="w-full max-w-2xl mx-auto mt-8 mb-12 px-2 sm:px-4 md:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-12 border border-blue-100 dark:border-blue-900">
          <div className="mb-6">
            <Link href="/customer/payments" className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg shadow hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" /></svg>
              Back to Payment Options
            </Link>
          </div>
          
          {/* Show network error alert if offline */}
          {!isOnline && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Network Connection Issue</AlertTitle>
              <AlertDescription>
                You appear to be offline. Payment processing requires an internet connection.
                Please check your network and try again when connected.
              </AlertDescription>
            </Alert>
          )}
          {!formData && !paymentSuccess && !paymentError && (
            <MultiStepForm onSubmit={handleFormSubmit} />
          )}

          {formData && !selectedGateway && !paymentSuccess && !paymentError && (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Select Payment Gateway</h2>
              
              {!isOnline && (
                <div className="mb-6 text-center">
                  <p className="text-red-600 dark:text-red-500 mb-4 font-medium">Payment options are disabled while offline.</p>
                  <p className="text-gray-800 dark:text-gray-300">Please check your internet connection and try again.</p>
                </div>
              )}
              
              <div className="flex flex-col md:flex-row justify-center gap-4">
                <button
                  onClick={() => handleGatewaySelection('phonepe')}
                  className={`bg-purple-600 text-white font-semibold px-6 py-3 rounded-lg shadow hover:bg-purple-700 focus:ring-2 focus:ring-purple-400 transition-colors ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!isOnline}
                >
                  Pay with PhonePe (Free)
                </button>
                <button
                  onClick={() => handleGatewaySelection('razorpay')}
                  className={`bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg shadow hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 transition-colors ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!isOnline}
                >
                  Pay with Razorpay
                </button>
                <button
                  onClick={() => handleGatewaySelection('cashfree')}
                  className={`bg-green-600 text-white font-semibold px-6 py-3 rounded-lg shadow hover:bg-green-700 focus:ring-2 focus:ring-green-400 transition-colors ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!isOnline}
                >
                  Pay with Cashfree
                </button>
              </div>
            </div>
          )}

          {formData && selectedGateway && !paymentSuccess && !paymentError && (
            <div>
              {/* Show network warning if user selected a gateway but is now offline */}
              {!isOnline && (
                <Alert className="mb-6 bg-yellow-50 border-yellow-200">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertTitle className="text-yellow-800">Network Connection Lost</AlertTitle>
                  <AlertDescription className="text-yellow-700">
                    Your internet connection appears to be offline. Payment processing may fail.
                    <Button 
                      variant="outline" 
                      className="mt-2" 
                      onClick={() => setSelectedGateway(null)}
                    >
                      Back to Payment Methods
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              
              {selectedGateway === 'razorpay' && (
                <RazorpayPayment
                  formData={formData}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              )}
              {selectedGateway === 'phonepe' && (
                <PhonePePayment
                  formData={formData}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              )}
              {selectedGateway === 'cashfree' && (
                <CashfreePayment
                  formData={formData}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  retryCount={retryCount}
                />
              )}
            </div>
          )}

          {paymentSuccess && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-green-600 dark:text-green-500 mb-4">Payment Successful!</h2>
              <p className="text-lg text-gray-800 dark:text-gray-200 mb-6">Thank you for your payment. Your receipt will be sent to your email.</p>
              <Link href="/" className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg shadow hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 transition-colors">Back to Home</Link>
            </div>
          )}
          {paymentError && (
            <div className="text-center p-8">
              <Alert variant="destructive" className="mb-6 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/30">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertTitle className="text-red-800 dark:text-red-300 font-semibold">Payment Failed</AlertTitle>
                <AlertDescription className="text-red-700 dark:text-red-200">
                  {paymentError.includes('network') || paymentError.includes('fetch failed') ? (
                    <>
                      Network connection issue detected. Please check your internet connection and try again.
                      {isOnline && <p className="mt-2 font-medium">Your connection appears to be restored. You can retry now.</p>}
                    </>
                  ) : paymentError.includes('timeout') ? (
                    <>The payment server is taking too long to respond. This could be due to high traffic or temporary issues.</>
                  ) : paymentError.includes('session') || paymentError.includes('expired') ? (
                    <>Your payment session has expired. Please start a new payment process.</>
                  ) : (
                    <>{paymentError}</>
                  )}
                </AlertDescription>
              </Alert>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {/* Show retry button if it's a network error and we're back online, or for timeout errors */}
                {((paymentError.includes('network') || paymentError.includes('fetch failed') || paymentError.includes('timeout')) && isOnline) && (
                  <Button 
                    onClick={retryPayment}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                    variant="default"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Retry Payment
                  </Button>
                )}
                
                <Button
                  onClick={resetPaymentFlow}
                  variant={((paymentError.includes('network') || paymentError.includes('timeout')) && isOnline) ? "outline" : "default"}
                  className={((paymentError.includes('network') || paymentError.includes('timeout')) && isOnline) ? 
                    "border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-950/50" : 
                    "bg-blue-600 hover:bg-blue-700 text-white"}
                >
                  Start Over
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}