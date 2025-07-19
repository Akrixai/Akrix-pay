'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { FormData, PaymentInitiateResponse, PaymentVerifyResponse } from '@/types';
import { apiService } from '@/services/api';

interface PaymentProcessorProps {
  formData: FormData;
  onSuccess: (receiptData: PaymentVerifyResponse) => void;
  onError: (error: string) => void;
}

export function PaymentProcessor({ formData, onSuccess, onError }: PaymentProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'processing' | 'success' | 'failed' | null>(null);
  const [currentStep, setCurrentStep] = useState<'saving' | 'processing' | 'verifying' | 'generating' | 'complete'>('saving');

  const processPayment = async () => {
    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      // Step 1: Save data to database and initiate payment
      setCurrentStep('saving');
      const initiateResponse: PaymentInitiateResponse = await apiService.initiatePayment(formData);

      // Step 2: Mock Razorpay payment (in real scenario, this would open Razorpay checkout)
      setCurrentStep('processing');
      await mockRazorpayPayment(initiateResponse);

    } catch (error) {
      console.error('Payment failed:', error);
      setPaymentStatus('failed');
      onError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const mockRazorpayPayment = async (initiateResponse: PaymentInitiateResponse) => {
    // Simulate Razorpay payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock successful payment response
    const mockPaymentId = `pay_${Math.random().toString(36).substring(2, 15)}`;
    const mockSignature = `sig_${Math.random().toString(36).substring(2, 15)}`;
    
    try {
      // Step 3: Verify payment and update database
      setCurrentStep('verifying');
      const verifyResponse = await apiService.verifyPayment({
        razorpayPaymentId: mockPaymentId,
        razorpayOrderId: initiateResponse.orderId,
        razorpaySignature: mockSignature,
        paymentId: initiateResponse.paymentId,
      });

      if (verifyResponse.success) {
        setCurrentStep('generating');
        setPaymentStatus('success');

        // Simulate receipt generation time
        await new Promise(resolve => setTimeout(resolve, 1000));
        setCurrentStep('complete');

        setTimeout(() => {
          onSuccess(verifyResponse);
        }, 500);
      } else {
        throw new Error(verifyResponse.message || 'Payment verification failed');
      }
    } catch (error) {
      setPaymentStatus('failed');
      throw error;
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'processing':
        return <Loader2 className="w-16 h-16 text-primary-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'failed':
        return <XCircle className="w-16 h-16 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    if (paymentStatus === 'processing') {
      switch (currentStep) {
        case 'saving':
          return {
            title: 'Saving to Database...',
            description: 'Securely storing your information in our database.'
          };
        case 'processing':
          return {
            title: 'Processing Payment...',
            description: 'Please wait while we process your payment securely.'
          };
        case 'verifying':
          return {
            title: 'Verifying Payment...',
            description: 'Confirming your payment and updating records.'
          };
        case 'generating':
          return {
            title: 'Generating Receipt...',
            description: 'Creating your professional receipt document.'
          };
        case 'complete':
          return {
            title: 'Almost Done!',
            description: 'Finalizing your receipt...'
          };
        default:
          return {
            title: 'Processing...',
            description: 'Please wait while we process your request.'
          };
      }
    }

    switch (paymentStatus) {
      case 'success':
        return {
          title: 'Payment Successful!',
          description: 'Your payment has been processed and saved to database successfully!'
        };
      case 'failed':
        return {
          title: 'Payment Failed',
          description: 'There was an issue processing your payment. Please try again.'
        };
      default:
        return {
          title: 'Ready to Pay',
          description: `You're about to pay ₹${formData.amount?.toLocaleString('en-IN')} to Akrix.ai`
        };
    }
  };

  const statusMessage = getStatusMessage();

  const getProgressPercentage = () => {
    if (paymentStatus === 'success') return 100;
    if (paymentStatus === 'failed') return 0;

    switch (currentStep) {
      case 'saving': return 20;
      case 'processing': return 40;
      case 'verifying': return 60;
      case 'generating': return 80;
      case 'complete': return 100;
      default: return 0;
    }
  };

  const getStepStatus = (step: string) => {
    const steps = ['saving', 'processing', 'verifying', 'generating', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    const stepIndex = steps.indexOf(step);

    if (paymentStatus === 'success') return 'complete';
    if (paymentStatus === 'failed') return 'failed';
    if (stepIndex < currentIndex) return 'complete';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center"
      >
        <div className="mb-6">
          <motion.div
            key={paymentStatus}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="flex justify-center mb-4"
          >
            {getStatusIcon()}
          </motion.div>
          
          <motion.div
            key={paymentStatus}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {statusMessage.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {statusMessage.description}
            </p>
          </motion.div>
        </div>

        {/* Progress Indicator for Database Operations */}
        {paymentStatus === 'processing' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
              <motion.div
                className="bg-gradient-primary h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${getProgressPercentage()}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span className={getStepStatus('saving') === 'complete' ? 'text-green-600' : getStepStatus('saving') === 'current' ? 'text-primary-600' : ''}>
                💾 Database
              </span>
              <span className={getStepStatus('processing') === 'complete' ? 'text-green-600' : getStepStatus('processing') === 'current' ? 'text-primary-600' : ''}>
                💳 Payment
              </span>
              <span className={getStepStatus('verifying') === 'complete' ? 'text-green-600' : getStepStatus('verifying') === 'current' ? 'text-primary-600' : ''}>
                ✅ Verify
              </span>
              <span className={getStepStatus('generating') === 'complete' ? 'text-green-600' : getStepStatus('generating') === 'current' ? 'text-primary-600' : ''}>
                📄 Receipt
              </span>
            </div>
          </motion.div>
        )}

        {!paymentStatus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Amount</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ₹{formData.amount?.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Recipient</span>
                <span className="font-semibold text-gray-900 dark:text-white">Akrix.ai</span>
              </div>
            </div>
            
            <button
              onClick={processPayment}
              disabled={isProcessing}
              className="w-full bg-gradient-primary text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {isProcessing ? 'Processing...' : 'Pay Now'}
            </button>
          </motion.div>
        )}

        {paymentStatus === 'failed' && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={() => {
              setPaymentStatus(null);
              setIsProcessing(false);
            }}
            className="w-full bg-red-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-600 transition-colors"
          >
            Try Again
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
