'use client';

import { motion } from 'framer-motion';
import { XCircle, RefreshCw, Home, AlertTriangle } from 'lucide-react';

interface PaymentFailureProps {
  error: any;
  onRetry: () => void;
  onNewPayment: () => void;
}

export function PaymentFailure({ error, onRetry, onNewPayment }: PaymentFailureProps) {
  const getErrorMessage = () => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    return 'An unexpected error occurred during payment processing.';
  };

  const getErrorCode = () => {
    if (error?.code) return error.code;
    if (error?.razorpay_error_code) return error.razorpay_error_code;
    return 'UNKNOWN_ERROR';
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center"
      >
        {/* Error Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
        </motion.div>

        {/* Error Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Payment Failed
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            We encountered an issue while processing your payment. Please try again.
          </p>
        </motion.div>

        {/* Error Details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 mb-8"
        >
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-4">
            Error Details
          </h3>
          <div className="space-y-3 text-left">
            <div className="flex justify-between">
              <span className="text-red-600 dark:text-red-400">Error Code:</span>
              <span className="text-red-900 dark:text-red-100 font-mono">
                {getErrorCode()}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-red-600 dark:text-red-400">Error Message:</span>
              <span className="text-red-900 dark:text-red-100 text-sm bg-red-100 dark:bg-red-900/40 p-3 rounded border">
                {getErrorMessage()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-600 dark:text-red-400">Time:</span>
              <span className="text-red-900 dark:text-red-100">
                {new Date().toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Common Issues */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 mb-8"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="text-left">
              <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                Common Issues & Solutions
              </h4>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• Check if your card has sufficient balance</li>
                <li>• Verify your card details are correct</li>
                <li>• Ensure your internet connection is stable</li>
                <li>• Try using a different payment method</li>
                <li>• Contact your bank if the issue persists</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <button
            onClick={onRetry}
            className="flex-1 py-3 px-6 bg-gradient-primary text-white rounded-lg font-semibold hover:opacity-90 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>

          <button
            onClick={onNewPayment}
            className="flex-1 py-3 px-6 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Start Over
          </button>
        </motion.div>

        {/* Support Information */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
        >
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Need Help?
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            If you continue to experience issues, please contact our support team at{' '}
            <a 
              href="mailto:support@akrix.ai" 
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              support@akrix.ai
            </a>
            {' '}or call us at{' '}
            <a 
              href="tel:+91-XXXXXXXXXX" 
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              +91-XXXXXXXXXX
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
