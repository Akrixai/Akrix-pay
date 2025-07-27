'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, AlertTriangle, Loader2, Download, Mail, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/utils/formatters';
import { Payment, Receipt, PaymentStatus as PaymentStatusType } from '@/types';

interface PaymentStatusProps {
  status: PaymentStatusType | 'LOADING' | 'ERROR';
  message?: string;
  errorDetails?: {
    code?: string;
    description?: string;
    isNetworkError?: boolean;
  };
  payment?: Payment | null;
  receipt?: Receipt | null;
  onRetry?: () => void;
  onGoHome?: () => void;
  onGoToPaymentOptions?: () => void;
}

export default function PaymentStatus({
  status,
  message,
  errorDetails,
  payment,
  receipt,
  onRetry,
  onGoHome,
  onGoToPaymentOptions
}: PaymentStatusProps) {
  const router = useRouter();
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const handleDownloadReceipt = async () => {
    if (!receipt?.id && !payment?.id) {
      alert('Receipt information not available');
      return;
    }
    
    try {
      setDownloadingPdf(true);
      
      let url;
      if (receipt?.id) {
        url = `/api/receipt/download/${receipt.id}`;
      } else if (payment?.id) {
        url = `/api/receipt/payment/${payment.id}/pdf`;
      } else {
        throw new Error('No receipt or payment ID available');
      }
      
      // Fetch the PDF
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to download receipt');
      }
      
      // Create a blob from the PDF Stream
      const blob = await response.blob();
      
      // Create a link element
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Receipt-${receipt?.receipt_number || payment?.order_id || 'payment'}.pdf`;
      
      // Append to the document and trigger download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      setDownloadingPdf(false);
    } catch (err) {
      console.error('Error downloading receipt:', err);
      setDownloadingPdf(false);
      alert('Failed to download receipt. Please try again.');
    }
  };

  const handleSendEmail = async () => {
    if (!receipt?.id && !payment?.id) {
      alert('Receipt information not available');
      return;
    }
    
    try {
      setSendingEmail(true);
      
      let url;
      if (receipt?.id) {
        url = `/api/receipt/send-email/${receipt.id}`;
      } else if (payment?.id) {
        url = `/api/receipt/payment/${payment.id}/email`;
      } else {
        throw new Error('No receipt or payment ID available');
      }
      
      const response = await fetch(url, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to send email');
      }
      
      const data = await response.json();
      alert(data.message || 'Receipt sent successfully!');
      setSendingEmail(false);
    } catch (err) {
      console.error('Error sending receipt email:', err);
      setSendingEmail(false);
      alert('Failed to send receipt email. Please try again.');
    }
  };


  const goToReceipt = () => {
    if (receipt?.id) {
      router.push(`/receipt/${receipt.id}`);
    } else if (payment?.id) {
      router.push(`/receipt/payment/${payment.id}`);
    } else {
      alert('Receipt information not available');
    }
  };

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      router.push('/');
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      router.push('/online-payment');
    }
  };

  const handleGoToPaymentOptions = () => {
    if (onGoToPaymentOptions) {
      onGoToPaymentOptions();
    } else {
      router.push('/online-payment');
    }
  };

  if (status === 'LOADING') {
    return (
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800">{message || 'Processing payment...'}</h2>
        <p className="text-gray-600 mt-2">Please wait while we process your transaction.</p>
      </div>
    );
  }

  if (status === 'ERROR') {
    return (
      <div className="text-center">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
        <p className="text-gray-600 mb-6">{message || 'An error occurred during payment processing.'}</p>
        
        {/* Error Details */}
        {errorDetails && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-red-50 rounded-lg p-6 mb-8 text-left"
          >
            <h3 className="text-lg font-semibold text-red-900 mb-4">
              Error Details
            </h3>
            <div className="space-y-3">
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
                  {message || 'Unknown error'}
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
        )}
        
        {/* Troubleshooting Tips */}
        {errorDetails?.isNetworkError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
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
        
        <div className="space-y-3 mt-6">
          <Button 
            onClick={handleRetry} 
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Try Again
          </Button>
          <Button 
            onClick={handleGoToPaymentOptions} 
            variant="outline"
            className="w-full"
          >
            Back to Payment Options
          </Button>
          <Button 
            onClick={handleGoHome} 
            variant="ghost"
            className="w-full"
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'SUCCESS') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-12 h-12 text-green-600" />
        </motion.div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
        <p className="text-gray-600 mb-6">{message || 'Your transaction has been completed successfully.'}</p>
        
        {/* Payment Details */}
        {payment && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-green-50 rounded-lg p-6 mb-6 text-left"
          >
            <h3 className="text-lg font-semibold text-green-900 mb-4 text-center">
              Payment Details
            </h3>
            <div className="space-y-3">
              {payment.order_id && (
                <div className="flex justify-between">
                  <span className="text-green-600">Order ID:</span>
                  <span className="text-green-900 font-mono">
                    {payment.order_id}
                  </span>
                </div>
              )}
              {receipt?.receipt_number && (
                <div className="flex justify-between">
                  <span className="text-green-600">Receipt Number:</span>
                  <span className="text-green-900 font-mono">
                    {receipt.receipt_number}
                  </span>
                </div>
              )}
              {payment.amount && (
                <div className="flex justify-between">
                  <span className="text-green-600">Amount:</span>
                  <span className="text-green-900 font-semibold">
                    {formatCurrency(payment.amount)}
                  </span>
                </div>
              )}
              {payment.payment_mode && (
                <div className="flex justify-between">
                  <span className="text-green-600">Payment Method:</span>
                  <span className="text-green-900">
                    {payment.payment_mode}
                  </span>
                </div>
              )}
              {payment.created_at && (
                <div className="flex justify-between">
                  <span className="text-green-600">Date:</span>
                  <span className="text-green-900">
                    {new Date(payment.created_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
        
        {/* Receipt Note */}
        {(receipt?.id || payment?.id) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-blue-50 rounded-lg p-4 mb-6 text-center text-blue-800 text-sm"
          >
            <p>A copy of your receipt has been sent to your email address.</p>
            <p className="mt-1">You can also download it below for your records.</p>
          </motion.div>
        )}
        
        {/* Receipt Actions */}
        {(receipt?.id || payment?.id) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-3 mt-4"
          >
            <Button
              onClick={handleDownloadReceipt}
              disabled={downloadingPdf}
              className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
            >
              {downloadingPdf ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download Receipt
                </>
              )}
            </Button>

            {(receipt?.id || payment?.id) && (
              <Button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
              >
                {sendingEmail ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    Send Receipt to Email
                  </>
                )}
              </Button>
            )}
            
            {receipt?.id && (
              <Button
                onClick={goToReceipt}
                variant="outline"
                className="w-full"
              >
                View Full Receipt
              </Button>
            )}
          </motion.div>
        )}
        
        <Button 
          onClick={handleGoHome} 
          className="mt-6 w-full flex items-center justify-center gap-2"
          variant="ghost"
        >
          <Home className="w-5 h-5" />
          Return to Home
        </Button>
      </motion.div>
    );
  }

  // For PENDING, CANCELLED, or FAILED statuses
  const statusConfig = {
    PENDING: {
      icon: <AlertTriangle className="w-12 h-12 text-yellow-500" />,
      title: 'Payment Pending',
      message: message || 'Your payment is being processed. Please wait.',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-600'
    },
    CANCELLED: {
      icon: <XCircle className="w-12 h-12 text-orange-500" />,
      title: 'Payment Cancelled',
      message: message || 'Your payment was cancelled.',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-600'
    },
    FAILED: {
      icon: <XCircle className="w-12 h-12 text-red-500" />,
      title: 'Payment Failed',
      message: message || 'Your payment could not be processed.',
      bgColor: 'bg-red-100',
      textColor: 'text-red-600'
    }
  };

  const config = statusConfig[status] || statusConfig.FAILED;

  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className={`w-20 h-20 ${config.bgColor} rounded-full flex items-center justify-center mx-auto mb-6`}
      >
        {config.icon}
      </motion.div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{config.title}</h2>
      <p className="text-gray-600 mb-6">{config.message}</p>
      
      <div className="space-y-3 mt-6">
        <Button 
          onClick={handleRetry} 
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          Try Again
        </Button>
        <Button 
          onClick={handleGoToPaymentOptions} 
          variant="outline"
          className="w-full"
        >
          Back to Payment Options
        </Button>
        <Button 
          onClick={handleGoHome} 
          variant="ghost"
          className="w-full"
        >
          Return to Home
        </Button>
      </div>
    </div>
  );
}