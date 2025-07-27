'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormData, PaymentInitiateResponse } from '@/types';
import { apiService } from '@/services/apiService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Script from 'next/script';
import cashfree from '@/lib/cashfree';

declare global {
  interface Window {
    Cashfree: (config: { mode: 'production' | 'sandbox' }) => {
      checkout: (options: { paymentSessionId: string, redirectTarget?: string }) => Promise<any>;
    };
  }
}

interface CashfreePaymentProps {
  formData: any;
  onSuccess: (data: any) => void;
  onError: (error: any) => void;
  retryCount?: number;
}

const CashfreePayment: React.FC<CashfreePaymentProps> = ({
  formData,
  onSuccess,
  onError,
  retryCount = 2
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentData, setPaymentData] = useState<PaymentInitiateResponse | null>(null);

  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online');
  const [initializationAttempts, setInitializationAttempts] = useState(0);
  
  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setNetworkStatus('online');
    const handleOffline = () => setNetworkStatus('offline');
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set initial status
    setNetworkStatus(navigator.onLine ? 'online' : 'offline');
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Create order when component mounts or when network status changes
  const createOrder = async () => {
    // Don't attempt to create order if offline
    if (networkStatus === 'offline') {
      setIsLoading(false);
      setErrorMessage('No internet connection. Please check your network and try again.');
      onError('No internet connection. Please check your network and try again.');
      return;
    }
    
    try {
      setIsLoading(true);
      // Add retry logic for network issues
      const initiateWithRetry = async (retries = retryCount, delay = 1000) => {
        try {
          return await apiService.initiatePayment({
            ...formData,
            paymentMode: 'CASHFREE',
          });
        } catch (error: any) {
          console.error('Payment initiation attempt failed:', error);
          if (retries > 0 && (error.message?.includes('fetch failed') || error.message?.includes('network') || error.message?.includes('timeout'))) {
            console.log(`Retrying payment initiation. Attempts remaining: ${retries-1}`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return initiateWithRetry(retries - 1, delay * 1.5);
          }
          throw error;
        }
      };

      const response = await initiateWithRetry();
      setPaymentData(response);
      console.log('Cashfree order created:', response);
      setInitializationAttempts(0); // Reset initialization attempts on success
      
      if (sdkLoaded) {
        initializePayment(response);
      }
    } catch (error: any) {
      console.error('Error initiating Cashfree payment:', error);
      setPaymentStatus('error');
      // Provide more specific error messages based on error type
      let errorMsg = 'Failed to initiate payment';
      if (error.message?.includes('fetch failed') || error.message?.includes('network')) {
        errorMsg = 'Network connection issue. Please check your internet connection and try again.';
      } else if (error.message?.includes('timeout')) {
        errorMsg = 'Request timed out. The payment server is taking too long to respond. Please try again.';
      } else if (error.response?.status === 500) {
        errorMsg = 'The payment server encountered an error. Please try again later.';
      }
      setErrorMessage(errorMsg);
      onError(errorMsg);
      
      // Increment initialization attempts for potential retry logic
      setInitializationAttempts(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle SDK load event
  const handleScriptLoad = () => {
    console.log('Cashfree SDK loaded successfully');
    setSdkLoaded(true);
    if (paymentData) {
      initializePayment(paymentData);
    }
  };

  // Handle SDK load error
  const handleScriptError = () => {
    console.error('Failed to load Cashfree SDK');
    setPaymentStatus('error');
    setErrorMessage('Failed to load payment gateway. Please try again.');
    onError('Failed to load payment gateway. Please try again.');
  };

  // Initialize payment when component mounts or when network status changes to online
  useEffect(() => {
    if (networkStatus === 'online') {
      createOrder();
    }
  }, [formData, networkStatus]);

  // Initialize payment modal (NO REDIRECT)
  const initializePayment = (paymentData: PaymentInitiateResponse) => {
    console.log('Initializing Cashfree payment with data:', paymentData);
    
    if (!paymentData.payment_session_id) {
      console.error('Missing payment session ID');
      setPaymentStatus('error');
      setErrorMessage('Failed to initialize Cashfree payment: Missing payment session ID');
      onError('Failed to initialize Cashfree payment: Missing payment session ID');
      return;
    }
    
    // Don't attempt to initialize payment if offline
    if (networkStatus === 'offline') {
      console.error('Cannot initialize payment while offline');
      setPaymentStatus('error');
      setErrorMessage('Cannot initialize payment while offline. Please check your internet connection.');
      onError('Cannot initialize payment while offline. Please check your internet connection.');
      return;
    }
    
    // Check if Cashfree is available in the window object
    if (typeof window.Cashfree === 'undefined') {
      console.error('Cashfree SDK not loaded properly - window.Cashfree is undefined');
      setPaymentStatus('error');
      setErrorMessage('Payment gateway not loaded properly. Please refresh the page and try again.');
      onError('Payment gateway not loaded properly. Please refresh the page and try again.');
      return;
    }

    console.log('Cashfree SDK found in window object, initializing with mode:', cashfree.mode);
    
    try {
      // Initialize Cashfree with mode
      const cashfreeInstance = window.Cashfree({
        mode: cashfree.mode,
      });
      
      console.log('Cashfree instance created successfully');

      // Modal checkout - stays in your app
      const checkoutOptions = {
        paymentSessionId: paymentData.payment_session_id,
        redirectTarget: '_self', // Changed from _modal to _self for better compatibility
        // Add optional parameters for better UX
        components: {
          // Customize the order details component
          orderDetails: {
            show: true,
            name: formData.name,
            amount: formData.amount,
            contact: formData.phone,
            email: formData.email
          }
        },
        // Add callback handlers for better error handling
        onError: (data: any) => {
          console.error('Cashfree onError callback:', data);
          setPaymentStatus('error');
          const errorMsg = data?.error?.message || 'Payment failed';
          setErrorMessage(errorMsg);
          onError(errorMsg);
        },
        onSuccess: (data: any) => {
          console.log('Cashfree onSuccess callback:', data);
          setPaymentStatus('success');
          onSuccess(data);
        },
        onCancel: (data: any) => {
          console.log('Cashfree onCancel callback:', data);
          setPaymentStatus('error');
          setErrorMessage('Payment was cancelled. You can try again when ready.');
          onError('Payment was cancelled');
        }
      };
      
      console.log('Calling Cashfree checkout with options:', checkoutOptions);

      // Use the initialized cashfree instance with better error handling
      cashfreeInstance.checkout(checkoutOptions)
        .then((result: any) => {
          console.log('Cashfree checkout result:', result);
          if (result.error) {
            console.error('Cashfree checkout returned error:', result.error);
            setPaymentStatus('error');
            // Provide more user-friendly error messages
            let errorMsg = result.error.message || 'Payment failed';
            if (errorMsg.includes('network') || errorMsg.includes('connectivity')) {
              errorMsg = 'Network issue during payment. Please check your internet connection and try again.';
            } else if (errorMsg.includes('session') || errorMsg.includes('expired')) {
              errorMsg = 'Payment session expired. Please refresh and try again.';
            } else if (errorMsg.includes('cancelled')) {
              errorMsg = 'Payment was cancelled. You can try again when ready.';
            }
            setErrorMessage(errorMsg);
            onError(errorMsg);
          } else if (result.paymentDetails) {
            console.log('Payment successful with details:', result.paymentDetails);
            setPaymentStatus('success');
            onSuccess(result.paymentDetails);
          } else {
            console.warn('Cashfree checkout returned without error or payment details:', result);
            setPaymentStatus('error');
            setErrorMessage('Payment response was incomplete. Please try again.');
            onError('Payment response was incomplete. Please try again.');
          }
        })
        .catch((error: any) => {
          console.error('Cashfree checkout error:', error);
          setPaymentStatus('error');
          // Provide more user-friendly error messages for common issues
          let errorMsg = error.message || 'Payment failed';
          if (errorMsg.includes('network') || errorMsg.includes('connectivity') || errorMsg.includes('fetch failed')) {
            errorMsg = 'Network issue during payment. Please check your internet connection and try again.';
          } else if (errorMsg.includes('timeout')) {
            errorMsg = 'Payment request timed out. Please try again.';
          } else if (errorMsg.includes('cancelled') || errorMsg.includes('canceled')) {
            errorMsg = 'Payment was cancelled. You can try again when ready.';
          }
          setErrorMessage(errorMsg);
          onError(errorMsg);
        });
    } catch (error: any) {
      console.error('Error initializing Cashfree checkout:', error);
      setPaymentStatus('error');
      const errorMsg = error.message?.includes('network') ? 
        'Network issue during payment initialization. Please check your internet connection and try again.' : 
        'Failed to initialize payment gateway. Please try again.';
      setErrorMessage(errorMsg);
      onError(errorMsg);
    }
  };

  // Load Cashfree SDK dynamically with better error handling
  useEffect(() => {
    // Don't load SDK if offline
    if (networkStatus === 'offline') {
      console.log('Not loading Cashfree SDK - device is offline');
      return;
    }
    
    // Remove any existing script to avoid duplicates
    const existingScript = document.getElementById('cashfree-sdk');
    if (existingScript) {
      existingScript.remove();
      console.log('Removed existing Cashfree SDK script');
    }
    
    // Create and append script
    const script = document.createElement('script');
    script.id = 'cashfree-sdk';
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    
    script.onload = () => {
      console.log('Cashfree SDK loaded successfully via dynamic script');
      setSdkLoaded(true);
      if (paymentData) {
        console.log('Payment data available, initializing payment');
        initializePayment(paymentData);
      }
    };
    
    script.onerror = () => {
      console.error('Failed to load Cashfree SDK via dynamic script');
      setPaymentStatus('error');
      setErrorMessage('Failed to load payment gateway. Please refresh and try again.');
      onError('Failed to load payment gateway. Please refresh and try again.');
    };
    
    document.body.appendChild(script);
    console.log('Appended Cashfree SDK script to body');
    
    return () => {
      // Clean up script on component unmount
      if (document.getElementById('cashfree-sdk')) {
        document.getElementById('cashfree-sdk')?.remove();
      }
    };
  }, [networkStatus, paymentData]);
  
  return (
    <>
      
      <div className="flex flex-col items-center justify-center space-y-4 p-4">
        {/* Debug information - only visible in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="w-full mb-4 p-3 bg-gray-100 border border-gray-300 rounded-lg text-xs font-mono overflow-auto">
            <h4 className="font-bold mb-1">Debug Info:</h4>
            <div className="grid grid-cols-2 gap-1">
              <span>SDK Loaded:</span><span>{sdkLoaded ? '✅ Yes' : '❌ No'}</span>
              <span>Network Status:</span><span>{networkStatus === 'online' ? '🌐 Online' : '🔌 Offline'}</span>
              <span>Payment Data:</span><span>{paymentData ? '✅ Available' : '❌ Missing'}</span>
              <span>Payment Session ID:</span>
              <span className="truncate">{paymentData?.payment_session_id ? paymentData.payment_session_id.substring(0, 15) + '...' : 'None'}</span>
              <span>Cashfree SDK:</span>
              <span>{typeof window !== 'undefined' && typeof window.Cashfree !== 'undefined' ? '✅ Available' : '❌ Missing'}</span>
              <span>Initialization Attempts:</span><span>{initializationAttempts}</span>
            </div>
          </div>
        )}
        
        {/* Show network status warning if offline */}
        {networkStatus === 'offline' && (
          <div className="w-full mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span className="font-medium">Network Connection Lost</span>
            </div>
            <p className="mt-2 text-sm">Your device appears to be offline. Payment processing requires an internet connection.</p>
          </div>
        )}
        
        {isLoading && (
          <div className="flex flex-col items-center justify-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-lg font-medium">Processing Cashfree Payment...</p>
            {initializationAttempts > 0 && (
              <p className="text-sm text-gray-500">Attempt {initializationAttempts + 1} of {retryCount + 1}...</p>
            )}
          </div>
        )}

        {paymentStatus === 'success' && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Payment Successful!</AlertTitle>
            <AlertDescription className="text-green-700">
              Your payment has been processed successfully.
            </AlertDescription>
          </Alert>
        )}

        {paymentStatus === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Payment Failed</AlertTitle>
            <AlertDescription>
              {errorMessage || 'There was an error processing your payment. Please try again.'}
            </AlertDescription>
          </Alert>
        )}

        <div id="cashfree-payment-container" className="w-full max-w-md"></div>
        
        {/* Show manual initialization button if SDK is loaded but payment hasn't started */}
        {sdkLoaded && paymentData && paymentStatus === 'idle' && !isLoading && (
          <div className="mt-4 text-center">
            <p className="mb-2 text-gray-600">If payment doesn't start automatically, click below:</p>
            <Button 
              onClick={() => initializePayment(paymentData)}
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              disabled={networkStatus === 'offline'}
            >
              Start Payment
            </Button>
          </div>
        )}

        {paymentStatus === 'error' && (
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <Button
              onClick={() => createOrder()}
              className="mt-4"
              variant="default"
              disabled={networkStatus === 'offline'}
            >
              Retry Payment
            </Button>
            <Button
              onClick={() => router.push('/')}
              className="mt-4"
              variant="outline"
            >
              Return Home
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default CashfreePayment;