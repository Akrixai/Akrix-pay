'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Download, FileText, Home, Loader2, Send } from 'lucide-react';

interface PaymentSuccessProps {
  paymentData: any;
  onNewPayment: () => void;
}

export function PaymentSuccess({ paymentData, onNewPayment }: PaymentSuccessProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const downloadReceipt = async () => {
    try {
      setIsDownloading(true);

      console.log('📄 Downloading receipt for payment:', paymentData);

      // Try to use receipt ID first, then fall back to payment ID
      let downloadUrl;
      if (paymentData.receipt && paymentData.receipt.receiptId) {
        downloadUrl = `/api/receipt/download/${paymentData.receipt.receiptId}`;
      } else if (paymentData.receiptId) {
        downloadUrl = `/api/receipt/download/${paymentData.receiptId}`;
      } else {
        downloadUrl = `/api/receipt/payment/${paymentData.id}/pdf`;
      }

      console.log('📄 Download URL:', downloadUrl);

      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error(`Failed to download receipt: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `receipt-${paymentData.receiptNumber || paymentData.receipt?.receiptNumber || 'unknown'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log('✅ Receipt downloaded successfully');
    } catch (error) {
      console.error('💥 Error downloading receipt:', error);
      alert(`Failed to download receipt: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const sendReceiptEmail = async () => {
    setIsSendingEmail(true);
    try {
      const receiptId = paymentData.receiptId || paymentData.id;
      const response = await fetch(`/api/receipt/send-email/${receiptId}`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        alert('Receipt emails sent successfully to both you and Akrix!');
      } else {
        alert('Failed to send emails: ' + data.message);
      }
    } catch (error) {
      console.error('Email sending failed:', error);
      alert('Failed to send emails. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
        </motion.div>

        {/* Success Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Payment Successful! 🎉
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Your payment has been processed successfully. Thank you for your business!
          </p>
        </motion.div>

        {/* Payment Details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-8"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Payment Details
          </h3>
          <div className="space-y-3 text-left">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Receipt Number:</span>
              <span className="text-gray-900 dark:text-white font-mono">
                {paymentData.receiptNumber || 'Generating...'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Payment ID:</span>
              <span className="text-gray-900 dark:text-white font-mono text-sm">
                {paymentData.razorpayPaymentId || paymentData.id}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Amount Paid:</span>
              <span className="text-green-600 dark:text-green-400 font-bold text-lg">
                ₹{parseFloat(paymentData.amount || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Payment Mode:</span>
              <span className="text-gray-900 dark:text-white">
                {paymentData.paymentMode || 'Online'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <span className="text-green-600 dark:text-green-400 font-semibold">
                Completed
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Date:</span>
              <span className="text-gray-900 dark:text-white">
                {new Date().toLocaleDateString('en-IN')}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={downloadReceipt}
              disabled={isDownloading}
              className="flex-1 py-3 px-6 bg-gradient-primary text-white rounded-lg font-semibold hover:opacity-90 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloading ? (
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
            </button>

            <button
              onClick={sendReceiptEmail}
              disabled={isSendingEmail}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending Email...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Receipt Email
                </>
              )}
            </button>
          </div>

          <button
            onClick={onNewPayment}
            className="w-full py-3 px-6 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            New Payment
          </button>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
        >
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-left">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Receipt Information
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Your receipt has been generated and is ready for download. 
                The PDF contains all payment details and can be used for your records.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
