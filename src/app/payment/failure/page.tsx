'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { XCircle, RefreshCw, Home, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion } from 'framer-motion';

export default function PaymentFailurePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [errorDetails, setErrorDetails] = useState<{
    message: string;
    code?: string;
    description?: string;
    isNetworkError?: boolean;
  }>({ message: 'An unknown error occurred' });
  
  useEffect(() => {
    // Extract error information from URL parameters
    const errorMessage = searchParams.get('error_message') || 'Payment processing failed';
    const errorCode = searchParams.get('error_code');
    const errorDescription = searchParams.get('error_description');
    const isNetworkError = searchParams.get('network_error') === 'true';
    
    setErrorDetails({
      message: errorMessage,
      code: errorCode || undefined,
      description: errorDescription || undefined,
      isNetworkError
    });
  }, [searchParams]);

  // Function to retry the payment
  const handleRetry = () => {
    router.push('/online-payment');
  };

  // Function to go back to payment selection
  const goToPaymentOptions = () => {
    router.push('/online-payment');
  };

  // Function to go home
  const goHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-100 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 rounded-xl shadow-xl border border-blue-100"
      >
        {/* Error Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <XCircle className="w-12 h-12 text-red-600" />
        </motion.div>

        {/* Error Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Failed
          </h1>
          <p className="text-gray-600 mb-6">
            {errorDetails.isNetworkError 
              ? 'We encountered a network issue while processing your payment.' 
              : 'We encountered an issue while processing your payment.'}
          </p>
        </motion.div>

        {/* Error Details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-red-50 rounded-lg p-6 mb-8"
        >
          <h3 className="text-lg font-semibold text-red-900 mb-4">
            Error Details
          </h3>
          <div className="space-y-3 text-left">
            {errorDetails.code && (
              <div className="flex justify-between">
                <span className="text-red-600">Error Code:</span>
                <span className="text-red-900 font-mono">
                  {errorDetails.code}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-red-600">Error:</span>
              <span className="text-red-900">
                {errorDetails.message}
              </span>
            </div>
            {errorDetails.description && (
              <div className="mt-2 pt-2 border-t border-red-200">
                <p className="text-red-800 text-sm">
                  {errorDetails.description}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Troubleshooting Tips */}
        {errorDetails.isNetworkError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-yellow-50 rounded-lg p-4 mb-6 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-800 mb-1">Network Issue Detected</h4>
              <ul className="text-sm text-yellow-700 list-disc pl-5 space-y-1">
                <li>Check your internet connection</li>
                <li>Ensure you have a stable network</li>
                <li>Try switching from Wi-Fi to mobile data (or vice versa)</li>
              </ul>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="space-y-3"
        >
          <Button
            onClick={handleRetry}
            className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </Button>

          <Button
            onClick={goToPaymentOptions}
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Payment Options
          </Button>

          <Button
            onClick={goHome}
            variant="ghost"
            className="w-full flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Return to Home
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}